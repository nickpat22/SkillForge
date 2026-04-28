import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function Insights() {
  const [insights, setInsights] = useState({
    learningPatterns: [],
    recommendations: [],
    aiInsights: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${API_URL}/insights`)
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading insights...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>AI Insights</h1>
        <p>Get personalized recommendations to improve your learning.</p>
      </div>

      {insights.aiInsights && (
        <div className="card ai-insight-card">
          <div className="ai-badge">🤖 AI Powered</div>
          <p className="ai-insight-text">{insights.aiInsights}</p>
        </div>
      )}

      <div className="card-grid" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3>Learning Patterns</h3>
          {insights.learningPatterns?.length > 0 ? (
            <ul className="pattern-list">
              {insights.learningPatterns.map((pattern, index) => (
                <li key={index}>{pattern}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No patterns detected yet.</p>
          )}
        </div>

        <div className="card">
          <h3>Recommendations</h3>
          {insights.recommendations?.length > 0 ? (
            <ul className="recommendation-list">
              {insights.recommendations.map((rec, index) => (
                <li key={index}>
                  <span className="rec-icon">💡</span>
                  {rec}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No recommendations yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}