

import os, json, numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from deepface import DeepFace
from supabase import create_client
from PIL import Image, ImageStat
import io, tempfile
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Warming up FaceNet model...")
    try:
        blank = Image.new("RGB", (160, 160), color=(200, 200, 200))
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        blank.save(tmp.name)
        DeepFace.represent(
            img_path=tmp.name,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=False
        )
        os.unlink(tmp.name)
        print("Model ready.")
    except Exception as e:
        print(f"Warmup note: {e}")
    yield


app = FastAPI(lifespan=lifespan)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Extra: manually add CORS headers to ALL responses ────────────
# This catches cases where FastAPI errors before middleware runs
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


# ── Supabase ─────────────────────────────────────────────────────
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"]
)

MODEL_NAME = "Facenet"
DETECTOR   = "opencv"
THRESHOLD  = 0.40


def image_to_tempfile(file_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    img.save(tmp.name, "JPEG")
    return tmp.name


def check_brightness(file_bytes: bytes) -> float:
    """Returns average brightness 0-255"""
    img  = Image.open(io.BytesIO(file_bytes)).convert("L")  # grayscale
    stat = ImageStat.Stat(img)
    return stat.mean[0]


def cosine_distance(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


# ── ROUTES ───────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "FaceAttend API running"}


@app.get("/ping")
def ping():
    return {"ok": True}


@app.post("/register")
async def register_student(
    photo:      UploadFile = File(...),
    course_id:  str = Form(...),
    name:       str = Form(...),
    student_id: str = Form(""),
    email:      str = Form(""),
    consent:    str = Form("true")
):
    try:
        file_bytes = await photo.read()

        # ── 1. Brightness check ──────────────────────────────────
        brightness = check_brightness(file_bytes)
        if brightness < 40:
            raise HTTPException(
                status_code=400,
                detail="Image too dark. Please move to a better lit area and retake."
            )
        if brightness > 230:
            raise HTTPException(
                status_code=400,
                detail="Image too bright / overexposed. Avoid direct light behind you."
            )

        tmp_path = image_to_tempfile(file_bytes)

        # ── 2. Detect faces ──────────────────────────────────────
        try:
            all_faces = DeepFace.represent(
                img_path=tmp_path,
                model_name=MODEL_NAME,
                detector_backend=DETECTOR,
                enforce_detection=True
            )
        except ValueError:
            os.unlink(tmp_path)
            raise HTTPException(
                status_code=400,
                detail="No face detected. Ensure your face is clearly visible and well-lit."
            )

        os.unlink(tmp_path)

        # ── 3. Multiple faces check ──────────────────────────────
        if len(all_faces) > 1:
            raise HTTPException(
                status_code=400,
                detail="Multiple faces detected. Only one person should be in the frame."
            )

        face_data = all_faces[0]
        embedding = face_data["embedding"]

        # ── 4. Face too small ────────────────────────────────────
        facial_area = face_data.get("facial_area", {})
        w = facial_area.get("w", 0)
        h = facial_area.get("h", 0)
        if w < 60 or h < 60:
            raise HTTPException(
                status_code=400,
                detail="Face too small. Please move closer to the camera and retake."
            )

        # ── 5. Face confidence ───────────────────────────────────
        confidence = face_data.get("face_confidence", 1.0)
        if confidence < 0.7:
            raise HTTPException(
                status_code=400,
                detail="Face not clear enough. Look directly at the camera and retake."
            )

        # ── 6. Save to Supabase ──────────────────────────────────
        res = supabase.table("students").insert({
            "course_id":      int(course_id),
            "name":           name,
            "student_id":     student_id or None,
            "email":          email or None,
            "face_embedding": json.dumps(embedding),
            "consent":        consent.lower() == "true"
        }).execute()

        return {"success": True, "student": res.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/match")
async def match_attendance(
    photos:    list[UploadFile] = File(...),
    course_id: str = Form(...),
    date:      str = Form("")
):
    try:
        result = supabase.table("students") \
            .select("id, name, student_id, face_embedding") \
            .eq("course_id", int(course_id)) \
            .execute()

        students = result.data
        if not students:
            raise HTTPException(status_code=404, detail="No students registered for this course")

        stored = []
        for s in students:
            if s["face_embedding"]:
                stored.append({
                    "id":         s["id"],
                    "name":       s["name"],
                    "student_id": s["student_id"],
                    "embedding":  json.loads(s["face_embedding"])
                })

        detected_embeddings = []
        for photo in photos:
            file_bytes = await photo.read()
            tmp_path   = image_to_tempfile(file_bytes)
            try:
                faces = DeepFace.represent(
                    img_path=tmp_path,
                    model_name=MODEL_NAME,
                    detector_backend=DETECTOR,
                    enforce_detection=False
                )
                for face in faces:
                    detected_embeddings.append(face["embedding"])
            except Exception:
                pass
            finally:
                os.unlink(tmp_path)

        if not detected_embeddings:
            raise HTTPException(status_code=400, detail="No faces detected in uploaded photos")

        present_ids = set()
        matches     = []

        for detected_emb in detected_embeddings:
            best_match    = None
            best_distance = 1.0
            for student in stored:
                dist = cosine_distance(detected_emb, student["embedding"])
                if dist < best_distance:
                    best_distance = dist
                    best_match    = student
            if best_match and best_distance <= THRESHOLD:
                if best_match["id"] not in present_ids:
                    present_ids.add(best_match["id"])
                    matches.append({
                        "student_db_id": best_match["id"],
                        "name":          best_match["name"],
                        "student_id":    best_match["student_id"],
                        "confidence":    round(1 - best_distance, 3),
                        "distance":      round(best_distance, 3)
                    })

        attendance_date = date or None
        records = []
        for match in matches:
            records.append({
                "course_id":  int(course_id),
                "student_id": match["student_db_id"],
                "date":       attendance_date,
                "status":     "present",
                "confidence": match["confidence"]
            })

        absent_ids = [s["id"] for s in stored if s["id"] not in present_ids]
        for sid in absent_ids:
            records.append({
                "course_id":  int(course_id),
                "student_id": sid,
                "date":       attendance_date,
                "status":     "absent",
                "confidence": None
            })

        if records:
            supabase.table("attendance").upsert(
                records,
                on_conflict="course_id,student_id,date"
            ).execute()

        return {
            "success":        True,
            "total_students": len(stored),
            "present":        len(matches),
            "absent":         len(absent_ids),
            "matches":        matches
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/students/{course_id}")
def get_students(course_id: int):
    result = supabase.table("students") \
        .select("id, name, student_id, email, registered_at, consent") \
        .eq("course_id", course_id) \
        .execute()
    return {"students": result.data}


@app.get("/attendance/{course_id}")
def get_attendance(course_id: int, date: str = ""):
    query = supabase.table("attendance") \
        .select("*, students(name, student_id)") \
        .eq("course_id", course_id)
    if date:
        query = query.eq("date", date)
    result = query.order("date", desc=True).execute()
    return {"attendance": result.data}