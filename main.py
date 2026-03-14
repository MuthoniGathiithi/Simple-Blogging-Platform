import os, json
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from PIL import Image, ImageStat
import face_recognition
import io
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("FaceAttend API ready.")
    yield


app = FastAPI(lifespan=lifespan)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# ── Supabase ──────────────────────────────────────────────────────
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"]
)

THRESHOLD = 0.50  # face_recognition uses distance — lower = more similar


def load_image(file_bytes: bytes):
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return np.array(img)


def check_brightness(file_bytes: bytes) -> float:
    img  = Image.open(io.BytesIO(file_bytes)).convert("L")
    stat = ImageStat.Stat(img)
    return stat.mean[0]


# ── ROUTES ────────────────────────────────────────────────────────

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

        # ── Brightness check ─────────────────────────────────────
        brightness = check_brightness(file_bytes)
        if brightness < 40:
            raise HTTPException(status_code=400, detail="Image too dark. Move to a better lit area and retake.")
        if brightness > 230:
            raise HTTPException(status_code=400, detail="Image too bright. Avoid direct light behind you.")

        # ── Get face encoding ────────────────────────────────────
        img = load_image(file_bytes)
        encodings = face_recognition.face_encodings(img)

        if len(encodings) == 0:
            raise HTTPException(status_code=400, detail="No face detected. Ensure your face is clearly visible.")
        if len(encodings) > 1:
            raise HTTPException(status_code=400, detail="Multiple faces detected. Only one person should be in frame.")

        embedding = encodings[0].tolist()

        # ── Save to Supabase ─────────────────────────────────────
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
                    "embedding":  np.array(json.loads(s["face_embedding"]))
                })

        detected_encodings = []
        for photo in photos:
            file_bytes = await photo.read()
            img        = load_image(file_bytes)
            encodings  = face_recognition.face_encodings(img)
            detected_encodings.extend(encodings)

        if not detected_encodings:
            raise HTTPException(status_code=400, detail="No faces detected in uploaded photos")

        present_ids = set()
        matches     = []

        for detected_enc in detected_encodings:
            if not stored:
                break
            known     = [s["embedding"] for s in stored]
            distances = face_recognition.face_distance(known, detected_enc)
            best_idx  = int(np.argmin(distances))
            best_dist = distances[best_idx]

            if best_dist <= THRESHOLD:
                student = stored[best_idx]
                if student["id"] not in present_ids:
                    present_ids.add(student["id"])
                    matches.append({
                        "student_db_id": student["id"],
                        "name":          student["name"],
                        "student_id":    student["student_id"],
                        "confidence":    round(1 - best_dist, 3),
                        "distance":      round(float(best_dist), 3)
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