import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Plus, X, Users, Trash2, ArrowLeft, Calendar, User } from 'lucide-react';

const STATUS_COLS = [
  { key: 'todo', label: 'To Do', className: 'column-todo' },
  { key: 'in_progress', label: 'In Progress', className: 'column-progress' },
  { key: 'done', label: 'Done', className: 'column-done' },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState('member');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // Task form
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  const isAdmin = userRole === 'admin';

  const fetchAll = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ]);
      setProject(projRes.data.project);
      setMembers(projRes.data.members);
      setUserRole(projRes.data.userRole);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/tasks`, {
        ...taskForm,
        assigned_to: taskForm.assigned_to || null,
        due_date: taskForm.due_date || null,
      });
      toast.success('Task created!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/tasks/${editTask.id}`, {
        ...taskForm,
        assigned_to: taskForm.assigned_to || null,
        due_date: taskForm.due_date || null,
      });
      toast.success('Task updated!');
      setEditTask(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      toast.success('Member added!');
      setMemberEmail('');
      setShowMemberModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || '',
    });
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary btn-icon" onClick={() => navigate('/projects')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{project?.name}</h1>
            <p className="page-subtitle">{project?.description || 'No description'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowMembersPanel(!showMembersPanel)}>
            <Users size={16} /> Members ({members.length})
          </button>
          {isAdmin && (
            <>
              <button className="btn btn-primary" onClick={() => { setEditTask(null); setTaskForm({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' }); setShowTaskModal(true); }}>
                <Plus size={16} /> Add Task
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>

      {/* Members Panel */}
      {showMembersPanel && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">Team Members</h3>
            {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}><Plus size={14} /> Add Member</button>}
          </div>
          <div className="member-list">
            {members.map(m => (
              <div className="member-item" key={m.id}>
                <div className="member-avatar">{m.name?.charAt(0).toUpperCase()}</div>
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-email">{m.email}</div>
                </div>
                <span className="member-role">{m.role}</span>
                {isAdmin && m.role !== 'admin' && (
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleRemoveMember(m.id)}><X size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="kanban-board">
        {STATUS_COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className={`kanban-column ${col.className}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const taskId = parseInt(e.dataTransfer.getData('taskId'));
                if (taskId) handleStatusChange(taskId, col.key);
              }}>
              <div className="kanban-column-header">
                <span className="kanban-column-title">{col.label}</span>
                <span className="kanban-column-count">{colTasks.length}</span>
              </div>
              <div className="kanban-tasks">
                {colTasks.map(task => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  return (
                    <div key={task.id} className="task-card" draggable
                      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id.toString())}
                      onClick={() => openEditTask(task)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div className="task-title">{task.title}</div>
                        {isAdmin && (
                          <button className="btn btn-icon btn-sm" style={{ opacity: 0.5, padding: 2 }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {task.description && <div className="task-desc">{task.description}</div>}
                      <div className="task-meta">
                        <span className={`task-badge badge-${task.priority}`}>{task.priority}</span>
                        {isOverdue && <span className="task-badge badge-overdue">Overdue</span>}
                        {task.due_date && (
                          <span className="task-due"><Calendar size={11} /> {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                        {task.assigned_to_name && (
                          <span className="task-assignee"><User size={11} /> {task.assigned_to_name}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Create/Edit Modal */}
      {(showTaskModal || editTask) && (
        <div className="modal-overlay" onClick={() => { setShowTaskModal(false); setEditTask(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editTask ? 'Edit Task' : 'Create Task'}</h3>
              <button className="modal-close" onClick={() => { setShowTaskModal(false); setEditTask(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={editTask ? handleUpdateTask : handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Task details..." value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                {editTask && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={taskForm.status || editTask.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-select" value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowTaskModal(false); setEditTask(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editTask ? 'Update Task' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Team Member</h3>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label">User Email</label>
                <input type="email" className="form-input" placeholder="team@example.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
