import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM checklists ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checklists' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM checklists WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Checklist not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

export default router;
