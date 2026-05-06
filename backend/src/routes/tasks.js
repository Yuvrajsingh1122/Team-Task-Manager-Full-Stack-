const express = require('express');
const db = require('../db');
const { verifyToken, requireProjectMember, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/projects/:id/tasks — create task
router.post('/projects/:id/tasks', verifyToken, requireProjectMember, (req, res) => {
  try {
    const { title, description, priority, assigned_to, due_date } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    // Validate assigned_to is a project member (if provided)
    if (assigned_to) {
      const isMember = db.prepare(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
      ).get(req.params.id, assigned_to);
      if (!isMember) {
        return res.status(400).json({ error: 'Assigned user is not a project member.' });
      }
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, project_id, assigned_to, due_date)
      VALUES (?, ?, 'todo', ?, ?, ?, ?)
    `).run(
      title.trim(),
      description || '',
      priority || 'medium',
      req.params.id,
      assigned_to || null,
      due_date || null
    );

    const task = db.prepare(`
      SELECT t.*, u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/projects/:id/tasks — list tasks in project
router.get('/projects/:id/tasks', verifyToken, requireProjectMember, (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT t.*, u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = ?
      ORDER BY 
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
        t.created_at DESC
    `).all(req.params.id);

    res.json({ tasks });
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/tasks/:taskId — update task
router.patch('/tasks/:taskId', verifyToken, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check membership
    const membership = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);
    if (!membership) {
      return res.status(403).json({ error: 'Not a project member.' });
    }

    const { title, description, status, priority, assigned_to, due_date } = req.body;

    // Members can only update status of tasks assigned to them
    if (membership.role === 'member') {
      if (title !== undefined || description !== undefined || priority !== undefined || 
          assigned_to !== undefined || due_date !== undefined) {
        // Only admin can update these fields
        if (task.assigned_to !== req.user.id) {
          return res.status(403).json({ error: 'You can only update status of tasks assigned to you.' });
        }
      }
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (due_date !== undefined) updates.due_date = due_date;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);

    db.prepare(`UPDATE tasks SET ${setClauses} WHERE id = ?`).run(...values, req.params.taskId);

    const updated = db.prepare(`
      SELECT t.*, u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `).get(req.params.taskId);

    res.json({ task: updated });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/tasks/:taskId — delete task
router.delete('/tasks/:taskId', verifyToken, (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check admin role
    const membership = db.prepare(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(task.project_id, req.user.id);
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.taskId);
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
