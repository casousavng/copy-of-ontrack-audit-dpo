import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Helper to convert PostgreSQL array format to JS array
const parseRoles = (pgRoles) => {
  if (!pgRoles) return [];
  if (Array.isArray(pgRoles)) return pgRoles;
  // Convert {ADMIN,DOT} format to ["ADMIN","DOT"]
  return pgRoles.replace(/[{}]/g, '').split(',').filter(r => r);
};

// Login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await query(
      'SELECT id, email, fullname, roles FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        name: user.fullname,
        roles: parseRoles(user.roles)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const result = await query(
      'SELECT id, email, fullname, roles FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      ...user,
      roles: parseRoles(user.roles)
    });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
