# Facial Recognition Attendance System

A complete facial recognition-based attendance tracking system with React frontend and FastAPI backend using InsightFace.

## Project Structure

```
.
├── frontend/          # React application
├── backend/           # FastAPI application
└── venv/              # Python virtual environment
```

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Activate virtual environment:
```bash
source ../venv/bin/activate
```

3. Install missing dependencies (if needed):
```bash
pip install sqlalchemy alembic python-jose[cryptography] passlib[bcrypt]
```

4. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your settings
```

5. Run the backend:
```bash
python run.py
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the frontend:
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Features

### Authentication
- User sign up and sign in
- JWT token-based authentication
- Protected routes

### Class Management
- Create classes with name and time
- View all classes in dashboard
- Class-specific operations

### Student Registration
- Video-based facial capture
- Multi-pose capture (right, left, up, down)
- Real-time visual prompts
- Stores 4 embeddings per student (one per pose)

### Attendance Marking
- Upload 2-8 classroom photos
- Automatic face detection and matching
- Real-time attendance processing
- Immediate results display

### Attendance Sheets
- Persistent attendance records per class
- Historical attendance tracking
- Student rows × Session columns layout
- PRESENT/ABSENT status indicators

## Technology Stack

### Backend
- FastAPI
- SQLAlchemy (SQLite/PostgreSQL)
- InsightFace for facial recognition
- JWT authentication
- Python 3.8+

### Frontend
- React 18
- React Router v6
- Vite
- Axios
- Modern CSS

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Classes
- `POST /api/classes/` - Create class
- `GET /api/classes/` - Get all classes
- `GET /api/classes/{id}` - Get class by ID

### Students
- `POST /api/students/register` - Register student with embeddings
- `POST /api/students/extract-embedding` - Extract embedding from image
- `GET /api/students/class/{class_id}` - Get students by class

### Attendance
- `POST /api/attendance/mark` - Mark attendance from photos
- `GET /api/attendance/sheet/{class_id}` - Get attendance sheet

## Facial Recognition Pipeline

1. **Detection** (`detection.py`) - Locate faces using InsightFace
2. **Normalization** (`normalization.py`) - Align and normalize faces
3. **Feature Extraction** (`feature_extraction.py`) - Generate 512-dim embeddings
4. **Matching** (`matching.py`) - Compare embeddings with cosine similarity

## Database Schema

- **Users**: User accounts (email, password, full_name)
- **Classes**: Class information (name, time, lecturer_id)
- **Students**: Student records (first_name, last_name, class_id)
- **StudentEmbeddings**: Facial embeddings (student_id, pose, embedding)
- **AttendanceSessions**: Attendance sessions (class_id, session_date)
- **AttendanceRecords**: Individual records (session_id, student_id, status)

## Security

- Password hashing with bcrypt
- JWT token authentication
- Protected API endpoints
- CORS configuration

## Notes

- InsightFace model (BUFFALO_L) will be downloaded automatically on first use
- Only embeddings are stored, never actual photos
- Each class has one persistent attendance sheet that grows with each session
- Minimum 2 names required for student registration
- 2-8 photos required for attendance marking

