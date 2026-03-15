import os, json
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from PIL import Image, ImageStat
from insightface.app import FaceAnalysis
import cv2, io
from contextlib import asynccontextmanager

face_app = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global face_app
    print("Loading buffalo_l model...")
    face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    face_app.prepare(ctx_id=0, det_size=(320, 320))
    print("Model ready.")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"]
)

THRESHOLD = 0.35

def load_cv2_image(file_bytes: bytes):
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def check_brightness(file_bytes: bytes) -> float:
    img  = Image.open(io.BytesIO(file_bytes)).convert("L")
    stat = ImageStat.Stat(img)
    return stat.mean[0]

def cosine_similarity(a, b):
    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b)
    return float(np.dot(a, b))

@app.get("/")
def root():
    return {"status": "FaceAttend API running"}

@app.get("/ping")
def ping():
    return {"ok": True}

@app.post("/register")
async def register_student(
    photos:     list[UploadFile] = File(...),
    course_id:  str = Form(...),
    name:       str = Form(...),
    student_id: str = Form(""),
    email:      str = Form(""),
    consent:    str = Form("true")
):
    try:
        embeddings = []
        for photo in photos:
            file_bytes = await photo.read()
            if not embeddings:
                brightness = check_brightness(file_bytes)
                if brightness < 40:
                    raise HTTPException(status_code=400, detail="Image too dark. Move to a better lit area.")
                if brightness > 230:
                    raise HTTPException(status_code=400, detail="Image too bright. Avoid direct light behind you.")
            img   = load_cv2_image(file_bytes)
            faces = face_app.get(img)
            if len(faces) == 0:
                continue
            face = max(faces, key=lambda f: f.det_score)
            embeddings.append(face.embedding.tolist())

        if not embeddings:
            raise HTTPException(status_code=400, detail="No face detected in any photo. Please ensure your face is clearly visible.")

        avg_embedding = np.mean(embeddings, axis=0).tolist()

        res = supabase.table("students").insert({
            "course_id":      int(course_id),
            "name":           name,
            "student_id":     student_id or None,
            "email":          email or None,
            "face_embedding": json.dumps(avg_embedding),
            "consent":        consent.lower() == "true"
        }).execute()

        return {"success": True, "student": res.data[0], "poses_used": len(embeddings)}

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
            img        = load_cv2_image(file_bytes)
            faces      = face_app.get(img)
            for face in faces:
                detected_embeddings.append(face.embedding.tolist())

        if not detected_embeddings:
            raise HTTPException(status_code=400, detail="No faces detected in uploaded photos")

        present_ids = set()
        matches     = []

        for detected_emb in detected_embeddings:
            best_match      = None
            best_similarity = -1.0
            for student in stored:
                sim = cosine_similarity(detected_emb, student["embedding"])
                if sim > best_similarity:
                    best_similarity = sim
                    best_match      = student

            print(f"Best: {best_match['name'] if best_match else 'none'} sim={best_similarity:.4f}")

            if best_match and best_similarity >= THRESHOLD:
                if best_match["id"] not in present_ids:
                    present_ids.add(best_match["id"])
                    matches.append({
                        "student_db_id": best_match["id"],
                        "name":          best_match["name"],
                        "student_id":    best_match["student_id"],
                        "confidence":    round(best_similarity, 3),
                        "distance":      round(1 - best_similarity, 3)
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