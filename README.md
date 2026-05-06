# TaskFlow — Team Task Manager

A full-stack team task management application built with Node.js, Express, and React.

## Features

- **User Authentication**: Secure signup and login with JWT.
- **Project Management**: Create projects and manage team members.
- **Task Management**: Kanban-style board for tracking tasks.
- **Dashboard**: Overview of project statistics and personal tasks.
- **Responsive Design**: Works on mobile and desktop.

## Tech Stack

- **Frontend**: React, Vite, Axios
- **Backend**: Node.js, Express, Better-SQLite3
- **Deployment**: Docker, Railway

## Getting Started

### Installation

1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Run the project**:
   ```bash
   npm run dev
   ```

## Deployment

To deploy on Railway:
1. Push to GitHub.
2. Connect the repository in Railway.
3. Set `PORT` to `5000` and add a `JWT_SECRET` variable.
4. Add a Persistent Volume mounted to `/app`.

---
Built by Yuvraj Singh
