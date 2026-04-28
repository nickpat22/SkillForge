import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatar: '',
    bio: '',
    stats: {
      totalHours: 0,
      coursesCompleted: 0,
      currentLevel: 1
    }
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile`)
      const data = await response.json()
      setProfile(data)
      setFormData(data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      setProfile(formData)
      setEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading profile...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account and view your learning stats.</p>
      </div>

      <div className="card profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} />
            ) : (
              <span>{profile.name?.charAt(0) || '?'}</span>
            )}
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </form>
        ) : (
          <div className="profile-info">
            <h2>{profile.name}</h2>
            <p className="profile-email">{profile.email}</p>
            <p className="profile-bio">{profile.bio}</p>
          </div>
        )}
      </div>

      <div className="card-grid" style={{ marginTop: '2rem' }}>
        <div className="card stat-card">
          <h3>Total Hours</h3>
          <p className="stat-value">{profile.stats.totalHours}h</p>
        </div>
        <div className="card stat-card">
          <h3>Courses Completed</h3>
          <p className="stat-value">{profile.stats.coursesCompleted}</p>
        </div>
        <div className="card stat-card">
          <h3>Current Level</h3>
          <p className="stat-value">Level {profile.stats.currentLevel}</p>
        </div>
      </div>
    </div>
  )
}