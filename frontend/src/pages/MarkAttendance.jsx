import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { attendanceAPI, classesAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import './MarkAttendance.css'

const MarkAttendance = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  
  const [photos, setPhotos] = useState([])
  const [classInfo, setClassInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attendanceResult, setAttendanceResult] = useState(null)

  useEffect(() => {
    loadClassInfo()
  }, [])

  const loadClassInfo = async () => {
    try {
      const response = await classesAPI.getById(classId)
      setClassInfo(response.data)
    } catch (error) {
      console.error('Error loading class:', error)
    }
  }

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length < 2 || files.length > 8) {
      setError('Please select 2-8 photos')
      return
    }

    setError('')
    const photoPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          // Remove data:image/jpeg;base64, prefix
          const base64 = e.target.result.split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(photoPromises).then(base64Photos => {
      setPhotos(base64Photos)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setAttendanceResult(null)

    if (photos.length < 2 || photos.length > 8) {
      setError('Please select 2-8 photos')
      return
    }

    setLoading(true)
    try {
      const response = await attendanceAPI.mark({
        class_id: parseInt(classId),
        photos: photos
      })
      setAttendanceResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to mark attendance')
    } finally {
      setLoading(false)
    }
  }

  const handleViewSheet = () => {
    navigate(`/attendance-sheet/${classId}`)
  }

  return (
    <div className="mark-attendance">
      <Sidebar onLogout={logout} />
      <div className="mark-content">
        <div className="mark-header">
          <h1>Mark Attendance</h1>
          {classInfo && <p className="class-info">{classInfo.name} - {classInfo.time}</p>}
        </div>

        {!attendanceResult ? (
          <form onSubmit={handleSubmit} className="mark-form">
            <div className="form-group">
              <label>Upload Classroom Photos (2-8 photos) *</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                required
              />
              <p className="help-text">Select 2-8 photos of the classroom. The system will detect and match faces.</p>
              {photos.length > 0 && (
                <div className="photos-preview">
                  <p>{photos.length} photo(s) selected</p>
                </div>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || photos.length === 0}
              >
                {loading ? 'Processing...' : 'Mark Attendance'}
              </button>
            </div>
          </form>
        ) : (
          <div className="attendance-result">
            <h2>Attendance Marked Successfully!</h2>
            <div className="result-summary">
              <p>Session Date: {new Date(attendanceResult.session_date).toLocaleString()}</p>
              <p>Total Students: {attendanceResult.records.length}</p>
              <p>Present: {attendanceResult.records.filter(r => r.status === 'PRESENT').length}</p>
              <p>Absent: {attendanceResult.records.filter(r => r.status === 'ABSENT').length}</p>
            </div>
            
            <div className="attendance-list">
              <h3>Attendance Records</h3>
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceResult.records.map((record) => (
                    <tr key={record.student_id}>
                      <td>{record.student_name}</td>
                      <td>
                        <span className={`status ${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="result-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setAttendanceResult(null)
                  setPhotos([])
                }}
              >
                Mark Another Session
              </button>
              <button
                className="btn btn-primary"
                onClick={handleViewSheet}
              >
                View Full Attendance Sheet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkAttendance

