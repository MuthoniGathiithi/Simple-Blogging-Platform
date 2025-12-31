import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import RegisterStudents from './pages/RegisterStudents'
import MarkAttendance from './pages/MarkAttendance'
import AttendanceSheet from './pages/AttendanceSheet'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-students/:classId"
            element={
              <ProtectedRoute>
                <RegisterStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mark-attendance/:classId"
            element={
              <ProtectedRoute>
                <MarkAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance-sheet/:classId"
            element={
              <ProtectedRoute>
                <AttendanceSheet />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

