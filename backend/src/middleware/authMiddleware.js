import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function normalizeRole(role) {
  if (!role) return 'developer';
  const r = String(role).trim().toLowerCase();
  if (r === 'owner' || r === 'admin') return 'admin';
  if (r === 'member' || r === 'developer') return 'developer';
  if (r === 'viewer' || r === 'read_only') return 'viewer';
  return r;
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Also support query param token for direct browser downloads
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const verified = jwt.verify(token, env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

export function requireRole(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ROLE',
        message: `Forbidden: Role '${req.user.role || 'viewer'}' does not have permission to perform this action. Required: ${allowedRoles.join(' or ')}.`,
      });
    }

    next();
  };
}
