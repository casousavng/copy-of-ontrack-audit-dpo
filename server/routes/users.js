import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Helper to convert PostgreSQL array format to JS array
const parseRoles = (pgRoles) => {
  if (!pgRoles) return [];
  if (Array.isArray(pgRoles)) return pgRoles;
  return pgRoles.replace(/[{}]/g, '').split(',').filter(r => r);
};

const parseAssignedStores = (pgStores) => {
  if (!pgStores) return [];
  if (Array.isArray(pgStores)) return pgStores;
  return pgStores.replace(/[{}]/g, '').split(',').filter(s => s).map(Number);
};

const formatUser = (user) => ({
  ...user,
  roles: parseRoles(user.roles),
  assigned_stores: parseAssignedStores(user.assigned_stores)
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, fullname, roles, amont_id, assigned_stores FROM users ORDER BY id'
    );
    res.json(result.rows.map(formatUser));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, fullname, roles, amont_id, assigned_stores FROM users WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(formatUser(result.rows[0]));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { email, fullname, roles, amontId, assignedStores } = req.body;
    
    const result = await query(
      `INSERT INTO users (email, fullname, roles, amont_id, assigned_stores) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, fullname, roles, amont_id, assigned_stores`,
      [email, fullname, roles || ['ADERENTE'], amontId || null, assignedStores || []]
    );
    
    res.status(201).json(formatUser(result.rows[0]));
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { email, fullname, roles, amontId, assignedStores } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET email = COALESCE($1, email), 
           fullname = COALESCE($2, fullname),
           roles = COALESCE($3, roles),
           amont_id = $4,
           assigned_stores = COALESCE($5, assigned_stores)
       WHERE id = $6
       RETURNING id, email, fullname, roles, amont_id, assigned_stores`,
      [email, fullname, roles, amontId, assignedStores, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Cannot delete user with dependencies' });
    }
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
