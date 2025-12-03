import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { auditId } = req.query;
    if (!auditId) return res.status(400).json({ error: 'auditId required' });
    const result = await query('SELECT * FROM audit_comments WHERE audit_id = $1 ORDER BY created_at', [auditId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { auditId, userId, content, isInternal } = req.body;
    const result = await query(
      `INSERT INTO audit_comments (audit_id, user_id, content, is_internal) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [auditId, userId, content, isInternal || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
