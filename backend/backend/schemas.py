from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Authentication Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Class Schemas
class ClassCreate(BaseModel):
    name: str
    time: str

class ClassResponse(BaseModel):
    id: int
    name: str
    time: str
    lecturer_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Student Schemas
class StudentCreate(BaseModel):
    first_name: str
    last_name: str

class StudentRegistration(BaseModel):
    first_name: str
    last_name: str
    class_id: int
    embeddings: dict  # {pose: [embedding_array]}

class StudentResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    class_id: int
    
    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceSubmission(BaseModel):
    class_id: int
    photos: List[str]  # Base64 encoded images

class AttendanceRecordResponse(BaseModel):
    student_id: int
    student_name: str
    status: str

class AttendanceSessionResponse(BaseModel):
    session_id: int
    session_date: datetime
    records: List[AttendanceRecordResponse]

class AttendanceSheetResponse(BaseModel):
    class_id: int
    class_name: str
    students: List[dict]  # [{student_id, student_name, sessions: [{session_date, status}]}]

