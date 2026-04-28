import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function Tracker() {
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrackerData()
  }, [])

  const fetchTrackerData = async () => {
    try {
      const response = await fetch(`${API_URL}/tracker`)
      const data = await response.json()
      setModules(data.modules || [])
      setProgress(data.progress || {})
    } catch (error) {
      console.error('Failed to fetch tracker:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (moduleId, status) => {
    try {
      await fetch(`${API_URL}/tracker/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchTrackerData()
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading tracker...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Progress Tracker</h1>
        <p>Track your learning journey module by module.</p>
      </div>

      <div className="module-list">
        {modules.length > 0 ? (
          modules.map((module) => (
            <div key={module.id} className="card module-card">
              <div className="module-header">
                <h3>{module.title}</h3>
                <span className={`status-badge ${module.status}`}>
                  {module.status}
                </span>
              </div>
              <p className="module-description">{module.description}</p>
              <div className="module-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
                <span className="progress-text">{module.progress}%</span>
              </div>
              <div className="module-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => updateProgress(module.id, 'in-progress')}
                >
                  Continue
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <p className="empty-state">No modules available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}