import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Tracker from './pages/Tracker'
import Insights from './pages/Insights'
import Profile from './pages/Profile'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="main-nav">
          <div className="logo">Skill<span>Forge</span></div>
          <div className="nav-links">
            <a href="/">Dashboard</a>
            <a href="/tracker">Tracker</a>
            <a href="/insights">Insights</a>
            <a href="/profile">Profile</a>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App