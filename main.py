import os, json, math
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from PIL import Image, ImageStat
from insightface.app import FaceAnalysis
import cv2, io
from contextlib import asynccontextmanager
from datetime import datetime, timezone

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

# ── Helpers ──────────────────────────────────────────────────────

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
    """Distance in metres between two GPS coordinates."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi       = math.radians(lat2 - lat1)
    dlambda    = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def get_client_ip(request: Request) -> str:
    """Get the real public IP, checking proxy headers first."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

def validate_token(token_str: str, client_ip: str, student_lat: float | None, student_lng: float | None) -> dict:
    """
    Fetch token from DB and validate:
      - exists and is active
      - not expired
      - IP matches (if set by teacher)
      - student is within geo radius (if coordinates saved)
    Returns the token row on success, raises HTTPException on failure.
    """
    res = supabase.table("attendance_tokens") \
        .select("*") \
        .eq("token", token_str) \
        .eq("is_active", True) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=403, detail="Invalid or inactive attendance link.")

    token = res.data[0]

    # Check expiry
    expires_at = datetime.fromisoformat(token["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=403, detail="This attendance link has expired. Ask your lecturer to generate a new one.")

    # Check IP if teacher set one
    if token.get("allowed_ip"):
        if client_ip != token["allowed_ip"]:
            raise HTTPException(
                status_code=403,
                detail=f"You must be on the school WiFi network to mark attendance. (Your IP: {client_ip})"
            )

    # Check geolocation if teacher saved coordinates
    if token.get("school_lat") and token.get("school_lng"):
        if student_lat is None or student_lng is None:
            raise HTTPException(status_code=403, detail="Location access is required to mark attendance. Please allow location in your browser.")
        distance = haversine_metres(token["school_lat"], token["school_lng"], student_lat, student_lng)
        radius   = token.get("geo_radius_m", 500)
        if distance > radius:
            raise HTTPException(
                status_code=403,
                detail=f"You appear to be {int(distance)}m away from the classroom. You must be on school premises to mark attendance."
            )

    return token

# ── Routes ───────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "FaceAttend API running"}

@app.get("/ping")
def ping():
    return {"ok": True}


# ── REGISTER ─────────────────────────────────────────────────────
@app.post("/register")
async def register_student(
    photos:           list[UploadFile] = File(...),
    course_id:        str  = Form(...),
    name:             str  = Form(...),
    admission_number: str  = Form(...),
    email:            str  = Form(""),
    consent:          str  = Form("true")
):
    try:
        # Validate 3-word name
        name_parts = name.strip().split()
        if len(name_parts) < 3:
            raise HTTPException(status_code=400, detail="Please enter your full name with at least 3 names (first, middle, last).")

        # Validate admission number not empty
        admission_number = admission_number.strip()
        if not admission_number:
            raise HTTPException(status_code=400, detail="Admission number is required.")

        # Check admission number not already registered for this course
        existing = supabase.table("students") \
            .select("id") \
            .eq("course_id", int(course_id)) \
            .eq("admission_number", admission_number) \
            .execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="This admission number is already registered for this course.")

        # Extract face embeddings from all pose photos
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
        # Catch unique constraint violation from DB as well
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(status_code=400, detail="This admission number is already registered for this course.")
        raise HTTPException(status_code=400, detail=str(e))


# ── MARK ATTENDANCE (student self-verification) ───────────────────
@app.post("/attend")
async def mark_attendance(
    request:     Request,
    photos:      list[UploadFile] = File(...),
    token:       str  = Form(...),
    student_lat: str  = Form(""),
    student_lng: str  = Form(""),
):
    try:
        client_ip = get_client_ip(request)

        # Parse optional GPS
        lat = float(student_lat) if student_lat else None
        lng = float(student_lng) if student_lng else None

        # Validate token (checks expiry, IP, geolocation)
        token_row = validate_token(token, client_ip, lat, lng)
        course_id = token_row["course_id"]

        # Load all registered students for this course
        result = supabase.table("students") \
            .select("id, name, admission_number, face_embedding") \
            .eq("course_id", course_id) \
            .execute()

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

        # Extract embeddings from the student's live pose photos
        detected_embeddings = []
        for photo in photos:
            file_bytes = await photo.read()
            img        = load_cv2_image(file_bytes)
            faces      = face_app.get(img)
            for face in faces:
                detected_embeddings.append(face.embedding.tolist())

        if not detected_embeddings:
            raise HTTPException(status_code=400, detail="No face detected in your photos. Please try again in better lighting.")

        # Average all pose embeddings for a stronger match
        avg_detected = np.mean(detected_embeddings, axis=0).tolist()

        # Find best matching student
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

        # Check if already marked today
        today = datetime.now(timezone.utc).date().isoformat()
        already = supabase.table("attendance") \
            .select("id, status") \
            .eq("course_id", course_id) \
            .eq("student_id", best_match["id"]) \
            .eq("date", today) \
            .execute()

        if already.data:
            return {
                "success":    True,
                "already_marked": True,
                "name":       best_match["name"],
                "admission":  best_match["admission_number"],
                "confidence": round(best_similarity, 3),
                "message":    f"Attendance already marked for {best_match['name']} today."
            }

        # Save attendance record
        supabase.table("attendance").insert({
            "course_id":   course_id,
            "student_id":  best_match["id"],
            "token_id":    token_row["id"],
            "date":        today,
            "status":      "present",
            "confidence":  round(best_similarity, 3),
            "student_lat": lat,
            "student_lng": lng,
            "marked_at":   datetime.now(timezone.utc).isoformat()
        }).execute()

        return {
            "success":    True,
            "already_marked": False,
            "name":       best_match["name"],
            "admission":  best_match["admission_number"],
            "confidence": round(best_similarity, 3),
            "message":    f"Attendance marked successfully for {best_match['name']}!"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── VALIDATE TOKEN (frontend pre-check before showing camera) ─────
@app.get("/token/{token_str}")
async def check_token(token_str: str, request: Request, lat: str = "", lng: str = ""):
    client_ip = get_client_ip(request)
    lat_f = float(lat) if lat else None
    lng_f = float(lng) if lng else None
    token_row = validate_token(token_str, client_ip, lat_f, lng_f)
    # Return course info so student page can show course name
    course = supabase.table("courses").select("title, code").eq("id", token_row["course_id"]).single().execute()
    return {
        "valid":      True,
        "course_id":  token_row["course_id"],
        "course":     course.data,
        "expires_at": token_row["expires_at"]
    }


# ── ORIGINAL MATCH (teacher bulk match — kept for backwards compat) ─
@app.post("/match")
async def match_attendance(
    photos:    list[UploadFile] = File(...),
    course_id: str = Form(...),
    date:      str = Form("")
):
    try:
        result = supabase.table("students") \
            .select("id, name, admission_number, face_embedding") \
            .eq("course_id", int(course_id)) \
            .execute()

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
                        "student_db_id":  best_match["id"],
                        "name":           best_match["name"],
                        "admission_number": best_match["admission_number"],
                        "confidence":     round(best_similarity, 3),
                        "distance":       round(1 - best_similarity, 3)
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


# ── GET STUDENTS ──────────────────────────────────────────────────
@app.get("/students/{course_id}")
def get_students(course_id: int):
    result = supabase.table("students") \
        .select("id, name, admission_number, email, registered_at, consent") \
        .eq("course_id", course_id) \
        .execute()
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