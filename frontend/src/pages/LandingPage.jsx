import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <div className="landing-container">
        <h1 className="landing-title">Facial Recognition Attendance System</h1>
        <p className="landing-subtitle">Modern attendance tracking with AI-powered facial recognition</p>
        
        <div className="landing-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/signin')}
          >
            Sign In
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage

