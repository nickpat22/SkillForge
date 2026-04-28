# SkillForge - AI-Powered Smart Learning Platform

A full-stack learning management system with AI-powered insights, quiz generation, and collaborative features.

## Project Structure

```
YASH/
├── frontend/          # Vite React frontend (Vercel deployable)
│   ├── src/
│   │   ├── pages/    # Dashboard, Tracker, Insights, Profile
│   │   ├── App.jsx   # Main app with routing
│   │   └── index.css # Global styles
│   ├── index.html    # Vite entry point
│   ├── vite.config.js
│   └── package.json
│
├── backend/           # Express API (Render deployable)
│   ├── server.js     # Main server entry
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   ├── db/           # Database connection
│   ├── .env          # Environment variables
│   └── package.json
│
├── vercel.json       # Vercel configuration
└── index.html       # Root redirect
```

## Quick Start

### Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

### Backend (Development)

```bash
cd backend
npm install
npm run dev
```

## Deployment

### Frontend → Vercel
1. Push to GitHub → Import to Vercel → Framework: Vite → Build: `npm run build` → Output: `dist`

### Backend → Render
1. Push to GitHub → Create Web Service → Build: `npm install` → Start: `npm start` → Add env vars

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Express 5, Socket.IO, MySQL
- **AI**: Google Gemini API
- **Deployment**: Vercel (frontend), Render (backend)

Nandini Singh
B.Tech CSE Student
