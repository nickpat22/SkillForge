import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudyTime: '0h',
    quizzesCompleted: 0,
    currentStreak: 0,
    averageScore: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`)
      const data = await response.json()
      setStats(data.stats || stats)
      setRecentActivity(data.recentActivity || [])
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your learning overview.</p>
      </div>

      <div className="card-grid">
        <div className="card stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Total Study Time</h3>
            <p className="stat-value">{stats.totalStudyTime}</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Quizzes Completed</h3>
            <p className="stat-value">{stats.quizzesCompleted}</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Current Streak</h3>
            <p className="stat-value">{stats.currentStreak} days</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Average Score</h3>
            <p className="stat-value">{stats.averageScore}%</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-type">{activity.type}</span>
                <span className="activity-desc">{activity.description}</span>
                <span className="activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No recent activity. Start learning!</p>
        )}
      </div>
    </div>
  )
}