# ═══════════════════════════════════════════════════════════════
# FaceAttend — FastAPI Backend
# Deploy on Render (free tier works)
# ═══════════════════════════════════════════════════════════════
# SETUP:
#   pip install fastapi uvicorn python-multipart deepface supabase numpy pillow tf-keras
#
# LOCAL RUN:
#   uvicorn main:app --reload
#
# ENV VARIABLES (set in Render dashboard):
#   SUPABASE_URL=https://yourproject.supabase.co
#   SUPABASE_SERVICE_KEY=your-service-role-key
# ═══════════════════════════════════════════════════════════════

import os, json, numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
from supabase import create_client
from PIL import Image
import io, tempfile

app = FastAPI()

# ── CORS ─────────────────────────────────────────────────────────
# Allow your Vercel frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your Vercel URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Supabase client (service key bypasses RLS) ───────────────────
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"]
)

# ── Model config ─────────────────────────────────────────────────
# Facenet512 = best accuracy/size balance for Render free tier
# Model downloads once on first request (~92MB) and is cached
MODEL_NAME   = "Facenet"        # ~92MB — good quality, Render-friendly
DETECTOR     = "opencv"         # fast, no extra download
DISTANCE     = "cosine"
THRESHOLD    = 0.40             # lower = stricter match


def image_to_tempfile(file_bytes: bytes) -> str:
    """Save bytes to a temp file, return path (DeepFace needs a path)"""
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    img.save(tmp.name, "JPEG")
    return tmp.name


def get_embedding(image_path: str) -> list[float]:
    """Extract face embedding from image path"""
    result = DeepFace.represent(
        img_path=image_path,
        model_name=MODEL_NAME,
        detector_backend=DETECTOR,
        enforce_detection=True
    )
    # result is a list of dicts — take first face
    return result[0]["embedding"]


def cosine_distance(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


# ── ROUTES ───────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "FaceAttend API running"}


@app.post("/register")
async def register_student(
    photo: UploadFile = File(...),
    course_id: str    = Form(...),
    name: str         = Form(...),
    student_id: str   = Form(""),
    email: str        = Form(""),
    consent: str      = Form("true")
):
    """
    Student registers their face.
    Called from /register?course=COURSE_ID page on Vercel.
    """
    try:
        file_bytes = await photo.read()
        tmp_path   = image_to_tempfile(file_bytes)

        # Extract embedding
        embedding = get_embedding(tmp_path)
        os.unlink(tmp_path)  # delete temp file immediately, never store photo

        # Save student + embedding to Supabase
        result = supabase.table("students").insert({
            "course_id":      int(course_id),
            "name":           name,
            "student_id":     student_id or None,
            "email":          email or None,
            "face_embedding": json.dumps(embedding),
            "consent":        consent.lower() == "true"
        }).execute()

        return {"success": True, "student": result.data[0]}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/match")
async def match_attendance(
    photos: list[UploadFile] = File(...),
    course_id: str           = Form(...),
    date: str                = Form("")      # optional, defaults to today
):
    """
    Teacher uploads 1-3 class photos.
    Returns list of matched student IDs with confidence scores.
    """
    try:
        # ── Step 1: fetch all students + embeddings for this course ──
        result = supabase.table("students") \
            .select("id, name, student_id, face_embedding") \
            .eq("course_id", int(course_id)) \
            .execute()

        students = result.data
        if not students:
            raise HTTPException(status_code=404, detail="No students registered for this course")

        # Parse stored embeddings
        stored = []
        for s in students:
            if s["face_embedding"]:
                stored.append({
                    "id":         s["id"],
                    "name":       s["name"],
                    "student_id": s["student_id"],
                    "embedding":  json.loads(s["face_embedding"])
                })

        # ── Step 2: extract all faces from uploaded photos ───────────
        detected_embeddings = []
        for photo in photos:
            file_bytes = await photo.read()
            tmp_path   = image_to_tempfile(file_bytes)
            try:
                # DeepFace can detect multiple faces in one image
                faces = DeepFace.represent(
                    img_path=tmp_path,
                    model_name=MODEL_NAME,
                    detector_backend=DETECTOR,
                    enforce_detection=False  # don't crash if no face found
                )
                for face in faces:
                    detected_embeddings.append(face["embedding"])
            except Exception:
                pass  # skip photo if face detection fails
            finally:
                os.unlink(tmp_path)

        if not detected_embeddings:
            raise HTTPException(status_code=400, detail="No faces detected in uploaded photos")

        # ── Step 3: match detected faces against stored embeddings ───
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

        # ── Step 4: save attendance records to Supabase ─────────────
        attendance_date = date or None  # Supabase defaults to today if null

        records = []
        for match in matches:
            records.append({
                "course_id":  int(course_id),
                "student_id": match["student_db_id"],
                "date":       attendance_date,
                "status":     "present",
                "confidence": match["confidence"]
            })

        # Also mark absent students
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
            # upsert so re-running doesn't duplicate
            supabase.table("attendance").upsert(
                records,
                on_conflict="course_id,student_id,date"
            ).execute()

        return {
            "success":       True,
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
    """Get all registered students for a course (for teacher dashboard)"""
    result = supabase.table("students") \
        .select("id, name, student_id, email, registered_at, consent") \
        .eq("course_id", course_id) \
        .execute()
    return {"students": result.data}


@app.get("/attendance/{course_id}")
def get_attendance(course_id: int, date: str = ""):
    """Get attendance records for a course, optionally filtered by date"""
    query = supabase.table("attendance") \
        .select("*, students(name, student_id)") \
        .eq("course_id", course_id)
    if date:
        query = query.eq("date", date)
    result = query.order("date", desc=True).execute()
    return {"attendance": result.data}