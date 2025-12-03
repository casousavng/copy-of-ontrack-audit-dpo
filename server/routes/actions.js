import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { auditId } = req.query;
    const queryText = auditId 
      ? 'SELECT * FROM action_plans WHERE audit_id = $1 ORDER BY due_date'
      : 'SELECT * FROM action_plans ORDER BY due_date';
    const params = auditId ? [auditId] : [];
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { auditId, criteriaId, title, description, responsible, dueDate, createdBy } = req.body;
    const result = await query(
      `INSERT INTO action_plans (audit_id, criteria_id, title, description, responsible, due_date, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [auditId, criteriaId, title, description, responsible, dueDate, createdBy]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create action' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, progress, completedDate } = req.body;
    const result = await query(
      `UPDATE action_plans 
       SET title = COALESCE($1, title), description = COALESCE($2, description),
           status = COALESCE($3, status), progress = COALESCE($4, progress),
           completed_date = COALESCE($5, completed_date)
       WHERE id = $6 RETURNING *`,
      [title, description, status, progress, completedDate, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Action not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update action' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM action_plans WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Action not found' });
    res.json({ message: 'Action deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete action' });
  }
});

export default router;
