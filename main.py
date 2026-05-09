import os, json, math, uuid
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from PIL import Image, ImageStat
from insightface.app import FaceAnalysis
import cv2, io
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from dateutil.parser import isoparse

face_app = None

# ── APP LIFESPAN ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global face_app
    print("Loading buffalo_l model...")
    face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    face_app.prepare(ctx_id=0, det_size=(320, 320))
    print("Model ready.")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# ── SUPABASE ────────────────────────────────────────────────────
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"]
)

THRESHOLD = 0.35

# ── HELPERS ─────────────────────────────────────────────────────
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

def haversine_metres(lat1, lng1, lat2, lng2) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi       = math.radians(lat2 - lat1)
    dlambda    = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

# ── ROBUST TIME PARSER ───────────────────────────────────────────
# python-dateutil handles ALL Supabase timestamp formats reliably:
# "2025-01-15T10:30:00Z", "2025-01-15T10:30:00+00:00",
# "2025-01-15T10:30:00.123456+00:00", naive "2025-01-15T10:30:00"
def parse_utc_time(value: str) -> datetime:
    dt = isoparse(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

# ── TOKEN VALIDATION ────────────────────────────────────────────
def validate_token_full(token_str: str, client_ip: str, student_lat, student_lng) -> dict:
    """Full validation at submit time — checks expiry + IP + geo."""
    res = supabase.table("attendance_tokens") \
        .select("*").eq("token", token_str).eq("is_active", True).execute()

    if not res.data:
        raise HTTPException(status_code=403, detail="Invalid or inactive attendance link.")

    token = res.data[0]

    expires_at = parse_utc_time(token["expires_at"])
    now        = now_utc()
    print(f"[DEBUG] now={now.isoformat()} expires_at={expires_at.isoformat()} diff={(expires_at - now).total_seconds():.1f}s")

    if now > expires_at:
        raise HTTPException(
            status_code=403,
            detail="This attendance link has expired. Ask your lecturer to generate a new one."
        )

    if token.get("allowed_ip"):
        if client_ip != token["allowed_ip"]:
            raise HTTPException(
                status_code=403,
                detail=f"You must be on the school WiFi to mark attendance. (Your IP: {client_ip})"
            )

    if token.get("school_lat") and token.get("school_lng"):
        if student_lat is None or student_lng is None:
            raise HTTPException(
                status_code=403,
                detail="Location access is required. Please allow location in your browser."
            )
        distance = haversine_metres(
            token["school_lat"], token["school_lng"],
            student_lat, student_lng
        )
        radius = token.get("geo_radius_m", 500)
        if distance > radius:
            raise HTTPException(
                status_code=403,
                detail=f"You appear to be {int(distance)}m away. You must be on school premises."
            )

    return token

# ── ROUTES ───────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "FaceAttend API running"}

@app.get("/ping")
def ping():
    return {"ok": True}

# ── GENERATE TOKEN ────────────────────────────────────────────────
# Called by teacher dashboard. Server computes expires_at in UTC
# so the client clock / timezone is completely irrelevant.
@app.post("/generate-token")
async def generate_token(
    course_id:    str = Form(...),
    teacher_id:   str = Form(...),
    duration_min: int = Form(90),
    allowed_ip:   str = Form(""),
    school_lat:   str = Form(""),
    school_lng:   str = Form(""),
    geo_radius_m: int = Form(500),
):
    try:
        token_str  = str(uuid.uuid4())
        expires_at = now_utc() + timedelta(minutes=duration_min)

        insert_data = {
            "token":        token_str,
            "course_id":    int(course_id),
            "teacher_id":   teacher_id,
            "expires_at":   expires_at.isoformat(),
            "is_active":    True,
            "geo_radius_m": geo_radius_m,
        }

        if allowed_ip.strip():
            insert_data["allowed_ip"] = allowed_ip.strip()

        if school_lat.strip() and school_lng.strip():
            insert_data["school_lat"] = float(school_lat)
            insert_data["school_lng"] = float(school_lng)

        supabase.table("attendance_tokens").insert(insert_data).execute()

        return {
            "success":    True,
            "token":      token_str,
            "expires_at": expires_at.isoformat(),
            "expires_in": f"{duration_min} minutes",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── VALIDATE TOKEN (GET — expiry check only, no IP/geo) ──────────
@app.get("/token/{token_str}")
async def check_token(token_str: str):
    res = supabase.table("attendance_tokens") \
        .select("*").eq("token", token_str).eq("is_active", True).execute()

    if not res.data:
        raise HTTPException(status_code=403, detail="Invalid or inactive attendance link.")

    token = res.data[0]

    expires_at = parse_utc_time(token["expires_at"])
    now        = now_utc()
    print(f"[DEBUG /token] now={now.isoformat()} expires_at={expires_at.isoformat()} diff={(expires_at - now).total_seconds():.1f}s")

    if now > expires_at:
        raise HTTPException(
            status_code=403,
            detail="This attendance link has expired. Ask your lecturer to generate a new one."
        )

    course = supabase.table("courses").select("title, code") \
        .eq("id", token["course_id"]).single().execute()

    return {
        "valid":      True,
        "course_id":  token["course_id"],
        "course":     course.data,
        "expires_at": token["expires_at"],
        "server_now": now.isoformat()
    }

# ── REGISTER ─────────────────────────────────────────────────────
@app.post("/register")
async def register_student(
    photos:           list[UploadFile] = File(...),
    course_id:        str = Form(...),
    name:             str = Form(...),
    admission_number: str = Form(...),
    email:            str = Form(""),
    consent:          str = Form("true")
):
    try:
        name_parts = name.strip().split()
        if len(name_parts) < 3:
            raise HTTPException(
                status_code=400,
                detail="Please enter your full name with at least 3 names (first, middle, last)."
            )

        admission_number = admission_number.strip()
        if not admission_number:
            raise HTTPException(status_code=400, detail="Admission number is required.")

        existing = supabase.table("students") \
            .select("id").eq("course_id", int(course_id)) \
            .eq("admission_number", admission_number).execute()
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="This admission number is already registered for this course."
            )

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
            if not faces:
                continue
            face = max(faces, key=lambda f: f.det_score)
            embeddings.append(face.embedding.tolist())

        if not embeddings:
            raise HTTPException(
                status_code=400,
                detail="No face detected in any photo. Please ensure your face is clearly visible."
            )

        avg_embedding = np.mean(embeddings, axis=0).tolist()

        res = supabase.table("students").insert({
            "course_id":        int(course_id),
            "name":             name.strip(),
            "admission_number": admission_number,
            "email":            email.strip() or None,
            "face_embedding":   json.dumps(avg_embedding),
            "consent":          consent.lower() == "true"
        }).execute()

        return {"success": True, "student": res.data[0], "poses_used": len(embeddings)}

    except HTTPException:
        raise
    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="This admission number is already registered for this course."
            )
        raise HTTPException(status_code=400, detail=str(e))

# ── MARK ATTENDANCE ───────────────────────────────────────────────
@app.post("/attend")
async def mark_attendance(
    request:     Request,
    photos:      list[UploadFile] = File(...),
    token:       str = Form(...),
    student_lat: str = Form(""),
    student_lng: str = Form(""),
):
    try:
        client_ip = get_client_ip(request)
        lat = float(student_lat) if student_lat else None
        lng = float(student_lng) if student_lng else None

        token_row = validate_token_full(token, client_ip, lat, lng)
        course_id = token_row["course_id"]

        result = supabase.table("students") \
            .select("id, name, admission_number, face_embedding") \
            .eq("course_id", course_id).execute()

        students = result.data
        if not students:
            raise HTTPException(status_code=404, detail="No students registered for this course yet.")

        stored = []
        for s in students:
            if s["face_embedding"]:
                stored.append({
                    "id":               s["id"],
                    "name":             s["name"],
                    "admission_number": s["admission_number"],
                    "embedding":        json.loads(s["face_embedding"])
                })

        detected_embeddings = []
        for photo in photos:
            file_bytes = await photo.read()
            img        = load_cv2_image(file_bytes)
            faces      = face_app.get(img)
            for face in faces:
                detected_embeddings.append(face.embedding.tolist())

        if not detected_embeddings:
            raise HTTPException(
                status_code=400,
                detail="No face detected. Please try again in better lighting."
            )

        avg_detected = np.mean(detected_embeddings, axis=0).tolist()

        best_match      = None
        best_similarity = -1.0
        for student in stored:
            sim = cosine_similarity(avg_detected, student["embedding"])
            if sim > best_similarity:
                best_similarity = sim
                best_match      = student

        if not best_match or best_similarity < THRESHOLD:
            raise HTTPException(
                status_code=400,
                detail="Face not recognised. Make sure you are registered for this course and try again in good lighting."
            )

        today = now_utc().date().isoformat()
        already = supabase.table("attendance") \
            .select("id").eq("course_id", course_id) \
            .eq("student_id", best_match["id"]).eq("date", today).execute()

        if already.data:
            return {
                "success":        True,
                "already_marked": True,
                "name":           best_match["name"],
                "admission":      best_match["admission_number"],
                "confidence":     round(best_similarity, 3),
                "message":        f"Attendance already marked for {best_match['name']} today."
            }

        supabase.table("attendance").insert({
            "course_id":   course_id,
            "student_id":  best_match["id"],
            "token_id":    token_row["id"],
            "date":        today,
            "status":      "present",
            "confidence":  round(best_similarity, 3),
            "student_lat": lat,
            "student_lng": lng,
            "marked_at":   now_utc().isoformat()
        }).execute()

        return {
            "success":        True,
            "already_marked": False,
            "name":           best_match["name"],
            "admission":      best_match["admission_number"],
            "confidence":     round(best_similarity, 3),
            "message":        f"Attendance marked successfully for {best_match['name']}!"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── MATCH (teacher bulk upload) ───────────────────────────────────
@app.post("/match")
async def match_attendance(
    photos:    list[UploadFile] = File(...),
    course_id: str = Form(...),
    date:      str = Form("")
):
    try:
        result = supabase.table("students") \
            .select("id, name, admission_number, face_embedding") \
            .eq("course_id", int(course_id)).execute()

        students = result.data
        if not students:
            raise HTTPException(status_code=404, detail="No students registered for this course")

        stored = []
        for s in students:
            if s["face_embedding"]:
                stored.append({
                    "id":               s["id"],
                    "name":             s["name"],
                    "admission_number": s["admission_number"],
                    "embedding":        json.loads(s["face_embedding"])
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
            if best_match and best_similarity >= THRESHOLD:
                if best_match["id"] not in present_ids:
                    present_ids.add(best_match["id"])
                    matches.append({
                        "student_db_id":    best_match["id"],
                        "name":             best_match["name"],
                        "admission_number": best_match["admission_number"],
                        "confidence":       round(best_similarity, 3),
                        "distance":         round(1 - best_similarity, 3)
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
            supabase.table("attendance").upsert(records, on_conflict="course_id,student_id,date").execute()

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

# ── GET STUDENTS ──────────────────────────────────────────────────
@app.get("/students/{course_id}")
def get_students(course_id: int):
    result = supabase.table("students") \
        .select("id, name, admission_number, email, registered_at, consent") \
        .eq("course_id", course_id).execute()
    return {"students": result.data}

# ── GET ATTENDANCE ────────────────────────────────────────────────
@app.get("/attendance/{course_id}")
def get_attendance(course_id: int, date: str = ""):
    query = supabase.table("attendance") \
        .select("*, students(name, admission_number)") \
        .eq("course_id", course_id)
    if date:
        query = query.eq("date", date)
    result = query.order("date", desc=True).execute()
    return {"attendance": result.data}