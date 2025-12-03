import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { auditId } = req.query;
    if (!auditId) return res.status(400).json({ error: 'auditId required' });
    const result = await query('SELECT * FROM audit_scores WHERE audit_id = $1', [auditId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { auditId, criteriaId, score, comment, photoUrl } = req.body;
    const result = await query(
      `INSERT INTO audit_scores (audit_id, criteria_id, score, comment, photo_url) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (audit_id, criteria_id) 
       DO UPDATE SET score = $3, comment = $4, photo_url = $5 
       RETURNING *`,
      [auditId, criteriaId, score, comment, photoUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save score' });
  }
});

export default router;
