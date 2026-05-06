const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

/**
 * Verify JWT token and attach user to req
 */
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Check if the user is an admin of the given project
 * Expects req.params.id or req.params.projectId
 */
function requireProjectAdmin(req, res, next) {
  const projectId = req.params.id || req.params.projectId;
  const membership = db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, req.user.id);

  if (!membership) {
    return res.status(403).json({ error: 'You are not a member of this project.' });
  }
  if (membership.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  req.memberRole = membership.role;
  next();
}

/**
 * Check if user is a member (any role) of the project
 */
function requireProjectMember(req, res, next) {
  const projectId = req.params.id || req.params.projectId;
  const membership = db.prepare(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?'
  ).get(projectId, req.user.id);

  if (!membership) {
    return res.status(403).json({ error: 'You are not a member of this project.' });
  }
  req.memberRole = membership.role;
  next();
}

module.exports = { verifyToken, requireProjectAdmin, requireProjectMember };
