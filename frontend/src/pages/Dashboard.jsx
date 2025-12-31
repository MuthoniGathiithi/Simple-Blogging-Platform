import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { classesAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import CreateClassModal from '../components/CreateClassModal'
import ClassCard from '../components/ClassCard'
import './Dashboard.css'

const Dashboard = () => {
  const { logout } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const response = await classesAPI.getAll()
      setClasses(response.data)
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClassCreated = () => {
    setShowCreateModal(false)
    loadClasses()
  }

  return (
    <div className="dashboard">
      <Sidebar onLogout={logout} />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>My Classes</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Class
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="empty-state">
            <p>No classes yet. Create your first class to get started!</p>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map((classItem) => (
              <ClassCard 
                key={classItem.id} 
                classItem={classItem}
                onUpdate={loadClasses}
              />
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreateClassModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleClassCreated}
          />
        )}
      </div>
    </div>
  )
}

export default Dashboard

