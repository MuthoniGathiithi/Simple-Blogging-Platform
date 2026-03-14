import os, json
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from PIL import Image, ImageStat
import httpx, io
from contextlib import asynccontextmanager

# ── One new env var to add to your existing Render service ────────
FACE_SERVICE_URL = os.environ.get("FACE_SERVICE_URL", "")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Main API ready.")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])

@app.middleware("http")
async def cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Uses your existing SUPABASE_URL + SUPABASE_SERVICE_KEY — untouched
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"]
)

def check_brightness(file_bytes: bytes) -> float:
    img  = Image.open(io.BytesIO(file_bytes)).convert("L")
    stat = ImageStat.Stat(img)
    return stat.mean[0]


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
        # Read all photo bytes
        all_bytes = []
        for i, photo in enumerate(photos):
            b = await photo.read()
            # Brightness check on first photo only
            if i == 0:
                brightness = check_brightness(b)
                if brightness < 40:
                    raise HTTPException(status_code=400, detail="Image too dark. Move to a better lit area.")
                if brightness > 230:
                    raise HTTPException(status_code=400, detail="Image too bright. Avoid direct light behind you.")
            all_bytes.append(b)

        # ── Call face service to get averaged embedding ───────────
        async with httpx.AsyncClient(timeout=60) as client:
            files = [("photos", (f"pose_{i}.jpg", b, "image/jpeg")) for i, b in enumerate(all_bytes)]
            resp  = await client.post(f"{FACE_SERVICE_URL}/embed", files=files)
            if resp.status_code != 200:
                detail = resp.json().get("detail", "Face service error")
                raise HTTPException(status_code=400, detail=detail)
            embedding = resp.json()["embedding"]

        # ── Save to Supabase ──────────────────────────────────────
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
        # Load stored embeddings from Supabase
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

        # Read all photo bytes
        all_bytes = [await photo.read() for photo in photos]

        # ── Call face service to compare faces ────────────────────
        async with httpx.AsyncClient(timeout=120) as client:
            files = [("photos", (f"photo_{i}.jpg", b, "image/jpeg")) for i, b in enumerate(all_bytes)]
            resp  = await client.post(
                f"{FACE_SERVICE_URL}/compare",
                files=files,
                data={"stored_embeddings": json.dumps(stored)}
            )
            if resp.status_code != 200:
                detail = resp.json().get("detail", "Face service error")
                raise HTTPException(status_code=400, detail=detail)
            face_matches = resp.json()["matches"]  # [{id, similarity}]

        # ── Build attendance records ──────────────────────────────
        present_ids = {m["id"] for m in face_matches}
        matches     = []
        for m in face_matches:
            student = next((s for s in stored if s["id"] == m["id"]), None)
            if student:
                matches.append({
                    "student_db_id": student["id"],
                    "name":          student["name"],
                    "student_id":    student["student_id"],
                    "confidence":    m["similarity"],
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