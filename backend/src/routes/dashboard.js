const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — aggregated stats for the logged-in user
router.get('/', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;

    // Total tasks across all user's projects
    const totalTasks = db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = ?
    `).get(userId);

    // Tasks by status
    const byStatus = db.prepare(`
      SELECT t.status, COUNT(*) as count FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = ?
      GROUP BY t.status
    `).all(userId);

    // Overdue tasks
    const overdue = db.prepare(`
      SELECT COUNT(*) as count FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = ? AND t.due_date < date('now') AND t.status != 'done'
    `).get(userId);

    // My tasks (assigned to me)
    const myTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assigned_to_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = ?
      ORDER BY 
        CASE WHEN t.due_date < date('now') AND t.status != 'done' THEN 0 ELSE 1 END,
        t.due_date ASC
      LIMIT 10
    `).all(userId);

    // Recent tasks across all projects
    const recentTasks = db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assigned_to_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON t.project_id = pm.project_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE pm.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 5
    `).all(userId);

    // Project count
    const projectCount = db.prepare(`
      SELECT COUNT(*) as count FROM project_members WHERE user_id = ?
    `).get(userId);

    const statusMap = { todo: 0, in_progress: 0, done: 0 };
    byStatus.forEach(s => { statusMap[s.status] = s.count; });

    res.json({
      stats: {
        totalTasks: totalTasks.count,
        todo: statusMap.todo,
        inProgress: statusMap.in_progress,
        done: statusMap.done,
        overdue: overdue.count,
        projectCount: projectCount.count,
      },
      myTasks,
      recentTasks,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
