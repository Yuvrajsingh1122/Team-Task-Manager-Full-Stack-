# 🚀 TaskFlow — Team Task Manager

TaskFlow is a professional, minimalist full-stack team management application. It allows teams to create projects, manage members, and track tasks via a clean, "Human-Centric" Kanban board interface inspired by the Y Combinator / Hacker News aesthetic.

## ✨ Key Features

- **Authentication**: Secure Signup and Login using JWT and bcrypt.
- **Project Management**: Create projects and manage team members with role-based access (Admin vs. Member).
- **Task Tracking**: Full Kanban-style task management with drag-and-drop status updates.
- **Role-Based Access Control**:
  - **Admins**: Can create tasks, add/remove members, and delete projects.
  - **Members**: Can view projects and update statuses of tasks assigned to them.
- **Dashboard**: Real-time overview of total, in-progress, completed, and overdue tasks.
- **Minimalist UI**: Light-themed, high-contrast design optimized for productivity and clarity.

## 🛠 Tech Stack

- **Frontend**: React 19 + Vite (Vanilla JavaScript)
- **Backend**: Node.js + Express
- **Database**: SQLite (via `better-sqlite3`)
- **Styling**: Modern Vanilla CSS
- **Orchestration**: `concurrently` (for running frontend/backend together)
- **Deployment**: Docker + Railway

## 📂 Project Structure

```text
├── backend/            # Express API & SQLite Database
├── frontend/           # React Application
├── Dockerfile          # Production Build Config
├── package.json        # Root scripts to manage both services
└── README.md           # You are here
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Yuvrajsingh1122/Team-Task-Manager-Full-Stack-.git
   cd Team-Task-Manager-Full-Stack-
   ```

2. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend: [http://localhost:5000](http://localhost:5000)

## 🌐 Deployment to Railway

This project is optimized for [Railway](https://railway.app/).

1. Connect your GitHub repository to Railway.
2. Add a **Persistent Volume** mounted to `/app` (required for SQLite to persist).
3. Set the following environment variables:
   - `JWT_SECRET`: A secure random string.
   - `PORT`: `5000`
4. Railway will automatically detect the `Dockerfile` and deploy the full-stack application.

---

Built with ❤️ by Yuvraj Singh
