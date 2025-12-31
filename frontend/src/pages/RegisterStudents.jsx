import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { studentsAPI, classesAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../contexts/AuthContext'
import './RegisterStudents.css'

const POSES = [
  { key: 'right', label: 'RIGHT', instruction: 'Please tilt your head to the RIGHT' },
  { key: 'left', label: 'LEFT', instruction: 'Please tilt your head to the LEFT' },
  { key: 'up', label: 'UP', instruction: 'Please tilt your head UP' },
  { key: 'down', label: 'DOWN', instruction: 'Please tilt your head DOWN' },
]

const RegisterStudents = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0)
  const [capturedPoses, setCapturedPoses] = useState({})
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [classInfo, setClassInfo] = useState(null)

  useEffect(() => {
    loadClassInfo()
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const loadClassInfo = async () => {
    try {
      const response = await classesAPI.getById(classId)
      setClassInfo(response.data)
    } catch (error) {
      console.error('Error loading class:', error)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Unable to access camera. Please grant camera permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null
    
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    return canvas.toDataURL('image/jpeg')
  }

  const extractEmbedding = async (imageData) => {
    // Extract base64 part (remove data:image/jpeg;base64, prefix)
    const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData
    
    // Send image to backend for embedding extraction
    try {
      const response = await fetch('http://localhost:8000/api/students/extract-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ image: base64 })
      })
      
      if (!response.ok) {
        throw new Error('Failed to extract embedding')
      }
      
      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error('Error extracting embedding:', error)
      throw error
    }
  }

  const handleCapturePose = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required')
      return
    }

    setIsCapturing(true)
    const currentPose = POSES[currentPoseIndex]
    const imageData = captureFrame()
    
    if (imageData) {
      // Extract embedding from the captured frame
      const embedding = await extractEmbedding(imageData)
      
      setCapturedPoses(prev => ({
        ...prev,
        [currentPose.key]: embedding
      }))

      // Move to next pose
      if (currentPoseIndex < POSES.length - 1) {
        setCurrentPoseIndex(currentPoseIndex + 1)
      }
    }
    setIsCapturing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required')
      return
    }

    if (Object.keys(capturedPoses).length !== 4) {
      setError('Please capture all 4 poses')
      return
    }

    setLoading(true)
    try {
      await studentsAPI.register({
        first_name: firstName,
        last_name: lastName,
        class_id: parseInt(classId),
        embeddings: capturedPoses
      })
      
      // Reset form
      setFirstName('')
      setLastName('')
      setCurrentPoseIndex(0)
      setCapturedPoses({})
      alert('Student registered successfully!')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register student')
    } finally {
      setLoading(false)
    }
  }

  const currentPose = POSES[currentPoseIndex]
  const allPosesCaptured = Object.keys(capturedPoses).length === 4

  return (
    <div className="register-students">
      <Sidebar onLogout={logout} />
      <div className="register-content">
        <div className="register-header">
          <h1>Register Student</h1>
          {classInfo && <p className="class-info">{classInfo.name} - {classInfo.time}</p>}
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="capture-section">
            <h3>Facial Recognition Capture</h3>
            <p className="instruction-text">{currentPose.instruction}</p>
            
            <div className="video-container">
              <video ref={videoRef} autoPlay playsInline className="video-preview" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className="pose-indicators">
              {POSES.map((pose, index) => (
                <div
                  key={pose.key}
                  className={`pose-indicator ${
                    index === currentPoseIndex ? 'active' : ''
                  } ${capturedPoses[pose.key] ? 'captured' : ''}`}
                >
                  {pose.label}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCapturePose}
              disabled={isCapturing || allPosesCaptured}
            >
              {isCapturing ? 'Capturing...' : `Capture ${currentPose.label} Pose`}
            </button>

            {allPosesCaptured && (
              <div className="success-message">
                ✓ All poses captured! You can now register the student.
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
              disabled={loading || !allPosesCaptured}
            >
              {loading ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterStudents

