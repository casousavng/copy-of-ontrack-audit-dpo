import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Get all audits
router.get('/', async (req, res) => {
  try {
    const { userId, storeId } = req.query;
    let queryText = 'SELECT * FROM audits';
    const params = [];
    
    if (userId) {
      queryText += ' WHERE dot_user_id = $1';
      params.push(userId);
    } else if (storeId) {
      queryText += ' WHERE store_id = $1';
      params.push(storeId);
    }
    
    queryText += ' ORDER BY dtstart DESC';
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// Get audit by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM audits WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// Create audit
router.post('/', async (req, res) => {
  try {
    const { storeId, dotUserId, checklistId, dtstart, status, createdBy } = req.body;
    const result = await query(
      `INSERT INTO audits (store_id, dot_user_id, checklist_id, dtstart, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [storeId, dotUserId, checklistId || 1, dtstart, status || 'SCHEDULED', createdBy]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({ error: 'Failed to create audit' });
  }
});

// Update audit
router.put('/:id', async (req, res) => {
  try {
    const { status, dtend, finalScore } = req.body;
    const result = await query(
      `UPDATE audits 
       SET status = COALESCE($1, status), 
           dtend = COALESCE($2, dtend),
           final_score = COALESCE($3, final_score)
       WHERE id = $4 RETURNING *`,
      [status, dtend, finalScore, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update audit' });
  }
});

// Delete audit
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM audits WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json({ message: 'Audit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete audit' });
  }
});

export default router;
