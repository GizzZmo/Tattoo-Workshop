/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { hashPassword, comparePassword, generateToken, validatePassword } from '../auth/utils.js';
import { authenticate, authorize } from '../auth/middleware.js';

const router = express.Router();

// Rate limiting helper - simple in-memory implementation
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email) {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: 0 };
  
  if (attempts.lockedUntil > now) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 60000);
    return { 
      allowed: false, 
      message: `Account locked. Try again in ${remainingTime} minute(s)` 
    };
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_TIME;
    loginAttempts.set(email, attempts);
    return { 
      allowed: false, 
      message: 'Too many failed attempts. Account locked for 15 minutes' 
    };
  }
  
  return { allowed: true };
}

function recordLoginAttempt(email, success) {
  if (success) {
    loginAttempts.delete(email);
  } else {
    const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: 0 };
    attempts.count++;
    loginAttempts.set(email, attempts);
  }
}

/**
 * POST /api/auth/register
 * Register a new user (admin only)
 */
export function registerRoute(db) {
  return [
    authenticate,
    authorize('admin'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').custom((value) => {
      const validation = validatePassword(value);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
    body('role').isIn(['admin', 'artist', 'receptionist']).withMessage('Invalid role'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, role, phone, bio } = req.body;

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const stmt = db.prepare(`
          INSERT INTO users (name, email, password_hash, role, phone, bio, status)
          VALUES (?, ?, ?, ?, ?, ?, 'active')
        `);
        
        const info = stmt.run(name, email, passwordHash, role, phone || null, bio || null);

        // Get created user (without password)
        const user = db.prepare(`
          SELECT id, name, email, role, status, phone, bio, avatar_url, created_at
          FROM users WHERE id = ?
        `).get(info.lastInsertRowid);

        res.status(201).json({ 
          success: true, 
          user,
          message: 'User created successfully'
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
      }
    }
  ];
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export function loginRoute(db) {
  return [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Check rate limiting
        const rateLimitCheck = checkRateLimit(email);
        if (!rateLimitCheck.allowed) {
          return res.status(429).json({ error: rateLimitCheck.message });
        }

        // Find user
        const user = db.prepare(`
          SELECT id, name, email, password_hash, role, status, phone, bio, avatar_url
          FROM users WHERE email = ?
        `).get(email);

        if (!user) {
          recordLoginAttempt(email, false);
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValid = await comparePassword(password, user.password_hash);
        if (!isValid) {
          recordLoginAttempt(email, false);
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if account is active
        if (user.status !== 'active') {
          return res.status(403).json({ error: 'Account is not active' });
        }

        // Update last login
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        // Record successful login
        recordLoginAttempt(email, true);

        // Generate token
        const token = generateToken(user);

        // Remove password hash from response
        delete user.password_hash;

        res.json({
          success: true,
          token,
          user,
          message: 'Login successful'
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
      }
    }
  ];
}

/**
 * GET /api/auth/me
 * Get current user profile
 */
export function getCurrentUserRoute(db) {
  return [
    authenticate,
    (req, res) => {
      try {
        const user = db.prepare(`
          SELECT id, name, email, role, status, phone, bio, avatar_url, created_at, last_login
          FROM users WHERE id = ?
        `).get(req.user.id);

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
      } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
      }
    }
  ];
}

/**
 * PUT /api/auth/me
 * Update current user profile
 */
export function updateProfileRoute(db) {
  return [
    authenticate,
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('bio').optional().trim(),
    body('avatar_url').optional().trim().isURL().withMessage('Avatar URL must be valid'),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone, bio, avatar_url } = req.body;
        const updates = [];
        const values = [];

        if (name !== undefined) {
          updates.push('name = ?');
          values.push(name);
        }
        if (phone !== undefined) {
          updates.push('phone = ?');
          values.push(phone);
        }
        if (bio !== undefined) {
          updates.push('bio = ?');
          values.push(bio);
        }
        if (avatar_url !== undefined) {
          updates.push('avatar_url = ?');
          values.push(avatar_url);
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.user.id);

        const stmt = db.prepare(`
          UPDATE users SET ${updates.join(', ')}
          WHERE id = ?
        `);
        stmt.run(...values);

        // Get updated user
        const user = db.prepare(`
          SELECT id, name, email, role, status, phone, bio, avatar_url, created_at, updated_at
          FROM users WHERE id = ?
        `).get(req.user.id);

        res.json({ 
          success: true, 
          user,
          message: 'Profile updated successfully'
        });
      } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
      }
    }
  ];
}

/**
 * PUT /api/auth/change-password
 * Change user password
 */
export function changePasswordRoute(db) {
  return [
    authenticate,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').custom((value) => {
      const validation = validatePassword(value);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

        // Verify current password
        const isValid = await comparePassword(currentPassword, user.password_hash);
        if (!isValid) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(newPasswordHash, req.user.id);

        res.json({ 
          success: true,
          message: 'Password changed successfully'
        });
      } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
      }
    }
  ];
}

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
export function getUsersRoute(db) {
  return [
    authenticate,
    authorize('admin'),
    (req, res) => {
      try {
        const users = db.prepare(`
          SELECT id, name, email, role, status, phone, bio, avatar_url, created_at, last_login
          FROM users
          ORDER BY created_at DESC
        `).all();

        res.json({ users });
      } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
      }
    }
  ];
}

/**
 * PUT /api/auth/users/:id
 * Update user (admin only)
 */
export function updateUserRoute(db) {
  return [
    authenticate,
    authorize('admin'),
    body('name').optional().trim().notEmpty(),
    body('role').optional().isIn(['admin', 'artist', 'receptionist']),
    body('status').optional().isIn(['active', 'inactive', 'suspended']),
    body('phone').optional().trim(),
    body('bio').optional().trim(),
    (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { name, role, status, phone, bio } = req.body;
        const updates = [];
        const values = [];

        if (name !== undefined) {
          updates.push('name = ?');
          values.push(name);
        }
        if (role !== undefined) {
          updates.push('role = ?');
          values.push(role);
        }
        if (status !== undefined) {
          updates.push('status = ?');
          values.push(status);
        }
        if (phone !== undefined) {
          updates.push('phone = ?');
          values.push(phone);
        }
        if (bio !== undefined) {
          updates.push('bio = ?');
          values.push(bio);
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        const stmt = db.prepare(`
          UPDATE users SET ${updates.join(', ')}
          WHERE id = ?
        `);
        stmt.run(...values);

        // Get updated user
        const user = db.prepare(`
          SELECT id, name, email, role, status, phone, bio, avatar_url, created_at, updated_at
          FROM users WHERE id = ?
        `).get(req.params.id);

        res.json({ 
          success: true, 
          user,
          message: 'User updated successfully'
        });
      } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
      }
    }
  ];
}

/**
 * DELETE /api/auth/users/:id
 * Delete user (admin only)
 */
export function deleteUserRoute(db) {
  return [
    authenticate,
    authorize('admin'),
    (req, res) => {
      try {
        // Prevent deleting yourself
        if (parseInt(req.params.id) === req.user.id) {
          return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Check if user exists
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Delete user
        db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

        res.json({ 
          success: true,
          message: 'User deleted successfully'
        });
      } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
      }
    }
  ];
}

export function setupAuthRoutes(app, db) {
  app.post('/api/auth/register', ...registerRoute(db));
  app.post('/api/auth/login', ...loginRoute(db));
  app.get('/api/auth/me', ...getCurrentUserRoute(db));
  app.put('/api/auth/me', ...updateProfileRoute(db));
  app.put('/api/auth/change-password', ...changePasswordRoute(db));
  app.get('/api/auth/users', ...getUsersRoute(db));
  app.put('/api/auth/users/:id', ...updateUserRoute(db));
  app.delete('/api/auth/users/:id', ...deleteUserRoute(db));
}
