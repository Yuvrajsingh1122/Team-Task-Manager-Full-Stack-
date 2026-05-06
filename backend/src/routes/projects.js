const express = require('express');
const db = require('../db');
const { verifyToken, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();

// POST /api/projects — create project
router.post('/', verifyToken, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const result = db.prepare(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)'
    ).run(name.trim(), description || '', req.user.id);

    // Add creator as admin member
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(result.lastInsertRowid, req.user.id, 'admin');

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ project });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/projects — list user's projects
router.get('/', verifyToken, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, pm.role as user_role,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);

    res.json({ projects });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/projects/:id — project detail
router.get('/:id', verifyToken, requireProjectMember, (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `).all(req.params.id);

    res.json({ project, members, userRole: req.memberRole });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/projects/:id/members — add member (admin only)
router.post('/:id/members', verifyToken, requireProjectAdmin, (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Member email is required.' });
    }

    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found with that email.' });
    }

    const existing = db.prepare(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?'
    ).get(req.params.id, user.id);
    if (existing) {
      return res.status(409).json({ error: 'User is already a member.' });
    }

    const memberRole = role === 'admin' ? 'admin' : 'member';
    db.prepare(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
    ).run(req.params.id, user.id, memberRole);

    res.status(201).json({ member: { ...user, role: memberRole } });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member (admin only)
router.delete('/:id/members/:userId', verifyToken, requireProjectAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    
    // Can't remove yourself if you're the only admin
    if (parseInt(userId) === req.user.id) {
      const adminCount = db.prepare(
        "SELECT COUNT(*) as count FROM project_members WHERE project_id = ? AND role = 'admin'"
      ).get(req.params.id);
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot remove the only admin.' });
      }
    }

    db.prepare(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?'
    ).run(req.params.id, userId);

    res.json({ message: 'Member removed.' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/projects/:id — delete project (admin only)
router.delete('/:id', verifyToken, requireProjectAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
