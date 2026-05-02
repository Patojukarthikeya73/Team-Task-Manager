# Team-Task-Manager
# 🚀 Team Task Manager

A modern full-stack Team Task Manager web application that enables teams to collaborate efficiently by creating projects, assigning tasks, tracking progress, and managing workflows with secure role-based access control.

---

# 🌐 Live Demo

🔗 Live URL: `https://your-live-app-url.up.railway.app`

---

# 📂 GitHub Repository

🔗 GitHub Repo: `https://github.com/your-username/team-task-manager`

---

# 🎥 Demo Video

🔗 Demo Video: `https://your-demo-video-link`

---

# 📌 Features

## 🔐 Authentication & Authorization

* User Signup & Login
* JWT-based Authentication
* Password Hashing using bcrypt
* Protected Routes
* Role-Based Access Control (RBAC)

## 👥 Roles

### Admin

* Create/Edit/Delete Projects
* Add or Remove Team Members
* Create/Assign/Delete Tasks
* Manage Task Status
* View Complete Dashboard Analytics

### Member

* View Assigned Projects
* Update Task Status
* Track Assigned Work
* View Dashboard

---

# 📁 Project Management

* Create and Manage Projects
* Add Project Descriptions
* Assign Team Members
* Track Project Progress
* Responsive Project Cards

---

# ✅ Task Management

* Create Tasks
* Assign Tasks to Team Members
* Edit/Delete Tasks
* Task Priority Levels
* Due Date Tracking
* Task Status Updates

### Task Status

* Todo
* In Progress
* Completed

### Task Priority

* Low
* Medium
* High

---

# 📊 Dashboard

The dashboard provides:

* Total Tasks
* Completed Tasks
* Pending Tasks
* Overdue Tasks
* Productivity Insights
* Recent Activities
* Status Distribution Charts

---

# 🎨 UI/UX Features

* Modern Responsive Design
* Mobile-Friendly Layout
* Dark/Light Mode
* Sidebar Navigation
* Toast Notifications
* Interactive Dashboard Cards
* Smooth Animations

---

# 🛠 Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* React Router DOM
* Axios

## Backend

* Node.js
* Express.js

## Database

* PostgreSQL
* Prisma ORM

## Authentication

* JWT (JSON Web Token)
* bcryptjs

## Deployment

* Railway
* Supabase PostgreSQL

---

# 🗄 Database Schema

## User

* id
* name
* email
* password
* role

## Project

* id
* name
* description

## Task

* id
* title
* description
* status
* priority
* dueDate

## ProjectMember

* userId
* projectId

---

# 📡 REST API Endpoints

# 🔐 Authentication APIs

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| POST   | /api/auth/signup | Register User    |
| POST   | /api/auth/login  | Login User       |
| GET    | /api/auth/me     | Get Current User |

---

# 📁 Project APIs

| Method | Endpoint          | Description       |
| ------ | ----------------- | ----------------- |
| GET    | /api/projects     | Get All Projects  |
| POST   | /api/projects     | Create Project    |
| GET    | /api/projects/:id | Get Project By ID |
| PUT    | /api/projects/:id | Update Project    |
| DELETE | /api/projects/:id | Delete Project    |

---

# ✅ Task APIs

| Method | Endpoint       | Description   |
| ------ | -------------- | ------------- |
| GET    | /api/tasks     | Get All Tasks |
| POST   | /api/tasks     | Create Task   |
| PUT    | /api/tasks/:id | Update Task   |
| DELETE | /api/tasks/:id | Delete Task   |

---

# 🔒 Role-Based Access Control

The application implements RBAC middleware to protect sensitive routes.

### Admin Access

* Full project and task management

### Member Access

* Limited to assigned tasks and projects

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

---

# 2️⃣ Setup Backend

```bash
cd server
npm install
```

Create `.env` file inside `server/`

```env
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
```

Run Backend:

```bash
npm run dev
```

---

# 3️⃣ Setup Frontend

```bash
cd client
npm install
```

Create `.env` file inside `client/`

```env
VITE_API_URL=https://your-backend-url.up.railway.app
```

Run Frontend:

```bash
npm run dev
```

---

# 🗄 Prisma Setup

Generate Prisma Client:

```bash
npx prisma generate
```

Run Database Migrations:

```bash
npx prisma migrate dev
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

# 🚂 Deployment Guide

## Backend Deployment (Railway)

1. Push code to GitHub
2. Login to Railway
3. Create New Project
4. Deploy from GitHub Repo
5. Add Environment Variables
6. Generate Public Domain

---

## Frontend Deployment

Deploy frontend using:

* Railway
  OR
* Vercel

Add frontend environment variable:

```env
VITE_API_URL=your_backend_url
```

---

# 🔐 Environment Variables

## Backend `.env`

```env
PORT=5000
DATABASE_URL=
JWT_SECRET=
```

## Frontend `.env`

```env
VITE_API_URL=
```

---

# 📂 Project Structure

```bash
team-task-manager/
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── App.jsx
│
├── server/
│   ├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── prisma/
│   └── server.js
│
└── README.md
```

---

# 🧪 Future Improvements

* Real-Time Collaboration
* Socket.io Integration
* Email Notifications
* Activity Logs
* File Attachments
* Team Chat
* AI Task Suggestions

# 📄 License

This project is licensed under the MIT License.

---

# ⭐ Acknowledgements

* React
* Express.js
* Prisma
* Railway
* Supabase
* Tailwind CSS
