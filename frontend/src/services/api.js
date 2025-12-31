import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
}

// Classes API
export const classesAPI = {
  create: (data) => api.post('/classes/', data),
  getAll: () => api.get('/classes/'),
  getById: (id) => api.get(`/classes/${id}`),
}

// Students API
export const studentsAPI = {
  register: (data) => api.post('/students/register', data),
  getByClass: (classId) => api.get(`/students/class/${classId}`),
}

// Attendance API
export const attendanceAPI = {
  mark: (data) => api.post('/attendance/mark', data),
  getSheet: (classId) => api.get(`/attendance/sheet/${classId}`),
}

export default api

