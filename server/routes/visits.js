import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Get all visits
router.get('/', async (req, res) => {
  try {
    const { userId, storeId, type } = req.query;
    let queryText = 'SELECT * FROM visits WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (userId) {
      queryText += ` AND user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }
    if (storeId) {
      queryText += ` AND store_id = $${paramCount}`;
      params.push(storeId);
      paramCount++;
    }
    if (type) {
      queryText += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    queryText += ' ORDER BY dtstart DESC';
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// Get visit by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM visits WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visit' });
  }
});

// Create visit
router.post('/', async (req, res) => {
  try {
    const { storeId, userId, type, title, description, dtstart, status, createdBy } = req.body;
    const result = await query(
      `INSERT INTO visits (store_id, user_id, type, title, description, dtstart, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [storeId, userId, type, title, description || '', dtstart, status || 'SCHEDULED', createdBy]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

// Update visit
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, dtend } = req.body;
    const result = await query(
      `UPDATE visits 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           dtend = COALESCE($4, dtend)
       WHERE id = $5 RETURNING *`,
      [title, description, status, dtend, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update visit' });
  }
});

// Delete visit
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM visits WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete visit' });
  }
});

export default router;
