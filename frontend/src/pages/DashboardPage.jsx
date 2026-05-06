import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, FolderKanban, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const stats = data?.stats || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><ClipboardList size={22} /></div>
          <div className="stat-value">{stats.totalTasks || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Clock size={22} /></div>
          <div className="stat-value">{stats.inProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={22} /></div>
          <div className="stat-value">{stats.done || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div className="stat-value">{stats.overdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><FolderKanban size={22} /></div>
          <div className="stat-value">{stats.projectCount || 0}</div>
          <div className="stat-label">Projects</div>
        </div>
      </div>

      {/* My Tasks */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">My Tasks</h3>
        </div>
        {data?.myTasks?.length > 0 ? (
          <div className="task-list">
            {data.myTasks.map(task => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
              return (
                <Link to={`/projects/${task.project_id}`} key={task.id} className="task-list-item" style={{ borderBottom: '1px solid #eee', padding: '8px 0', display: 'flex', gap: '10px' }}>
                  <span className={`status-dot ${task.status}`} />
                  <span className="task-title" style={{ flex: 1 }}>{task.title}</span>
                  <span className="task-project" style={{ color: '#828282', fontSize: '11px' }}>{task.project_name}</span>
                  <span className={`task-badge ${task.priority === 'high' ? 'badge-high' : task.priority === 'medium' ? 'badge-medium' : 'badge-low'}`} style={{ fontSize: '9px' }}>{task.priority}</span>
                  {isOverdue && <span className="task-badge badge-overdue" style={{ fontSize: '9px' }}>Overdue</span>}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state"><p>No tasks assigned to you yet.</p></div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Tasks</h3>
          <Link to="/projects" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        {data?.recentTasks?.length > 0 ? (
          <div className="task-list">
            {data.recentTasks.map(task => (
              <Link to={`/projects/${task.project_id}`} key={task.id} className="task-list-item" style={{ borderBottom: '1px solid #eee', padding: '8px 0', display: 'flex', gap: '10px' }}>
                <span className={`status-dot ${task.status}`} />
                <span className="task-title" style={{ flex: 1 }}>{task.title}</span>
                <span className="task-project" style={{ color: '#828282', fontSize: '11px' }}>{task.project_name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><p>No tasks yet. Create a project to get started!</p></div>
        )}
      </div>
    </div>
  );
}
