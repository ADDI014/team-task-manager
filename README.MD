# TaskFlow - Team Task Manager

A full-stack web application for teams to manage projects, assign tasks, and track progress with role-based access.

## Tech Stack

**Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT Auth  
**Frontend:** React (Vite), Tailwind CSS, React Router, Axios

## Features

- 🔐 Authentication (Signup/Login with JWT)
- 👥 Role-based access (Admin/Member)
- 📁 Project & team management
- ✅ Task creation, assignment & status tracking
- 📊 Dashboard with stats (tasks, overdue, progress)
- 🎯 Kanban-style task board (Todo / In Progress / Done)
- ⚡ Overdue task detection

## Local Setup

### Backend
\`\`\`bash
cd backend
npm install
# Create .env (see .env.example)
npm run dev
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Deployment

Deployed on Railway: **[LIVE_URL_HERE]**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/projects | Get all projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/members | Add member |
| GET | /api/tasks?projectId=xxx | Get tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/tasks/dashboard | Dashboard stats |