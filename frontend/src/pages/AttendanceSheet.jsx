import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { attendanceAPI, classesAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import './AttendanceSheet.css'

const AttendanceSheet = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  
  const [sheetData, setSheetData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAttendanceSheet()
  }, [])

  const loadAttendanceSheet = async () => {
    try {
      const response = await attendanceAPI.getSheet(classId)
      setSheetData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load attendance sheet')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="attendance-sheet">
        <Sidebar onLogout={logout} />
        <div className="sheet-content">
          <div className="loading">Loading attendance sheet...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="attendance-sheet">
        <Sidebar onLogout={logout} />
        <div className="sheet-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    )
  }

  if (!sheetData || !sheetData.students || sheetData.students.length === 0) {
    return (
      <div className="attendance-sheet">
        <Sidebar onLogout={logout} />
        <div className="sheet-content">
          <div className="empty-state">
            <p>No students registered in this class yet.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/register-students/${classId}`)}
            >
              Register Students
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Get all unique session dates
  const allSessions = new Set()
  sheetData.students.forEach(student => {
    student.sessions.forEach(session => {
      allSessions.add(session.session_date)
    })
  })
  const sessionDates = Array.from(allSessions).sort()

  return (
    <div className="attendance-sheet">
      <Sidebar onLogout={logout} />
      <div className="sheet-content">
        <div className="sheet-header">
          <div>
            <h1>{sheetData.class_name}</h1>
            <p className="class-id">Class ID: {sheetData.class_id}</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>

        <div className="sheet-container">
          <div className="sheet-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th className="sticky-col">Student Name</th>
                  {sessionDates.map((date, index) => (
                    <th key={index}>
                      {new Date(date).toLocaleDateString()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetData.students.map((student) => (
                  <tr key={student.student_id}>
                    <td className="sticky-col student-name">
                      {student.student_name}
                    </td>
                    {sessionDates.map((date, index) => {
                      const session = student.sessions.find(
                        s => s.session_date === date
                      )
                      const status = session ? session.status : '-'
                      return (
                        <td key={index}>
                          <span className={`status ${status.toLowerCase()}`}>
                            {status}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sheet-footer">
          <div className="legend">
            <span className="legend-item">
              <span className="status present">PRESENT</span>
            </span>
            <span className="legend-item">
              <span className="status absent">ABSENT</span>
            </span>
            <span className="legend-item">
              <span className="status">-</span> Not Recorded
            </span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/mark-attendance/${classId}`)}
          >
            Mark New Attendance
          </button>
        </div>
      </div>
    </div>
  )
}

export default AttendanceSheet

