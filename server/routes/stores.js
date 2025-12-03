import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Get all stores
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM stores ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Get store by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM stores WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// Create store
router.post('/', async (req, res) => {
  try {
    const { codehex, brand, size, city, gpslat, gpslong, dotUserId, aderenteId } = req.body;
    const result = await query(
      `INSERT INTO stores (codehex, brand, size, city, gpslat, gpslong, dot_user_id, aderente_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [codehex, brand, size, city, gpslat || 0, gpslong || 0, dotUserId || null, aderenteId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create store error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Store code already exists' });
    }
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Update store
router.put('/:id', async (req, res) => {
  try {
    const { codehex, brand, size, city, gpslat, gpslong, dotUserId, aderenteId } = req.body;
    const result = await query(
      `UPDATE stores 
       SET codehex = COALESCE($1, codehex), brand = COALESCE($2, brand),
           size = COALESCE($3, size), city = COALESCE($4, city),
           gpslat = COALESCE($5, gpslat), gpslong = COALESCE($6, gpslong),
           dot_user_id = $7, aderente_id = $8
       WHERE id = $9 RETURNING *`,
      [codehex, brand, size, city, gpslat, gpslong, dotUserId, aderenteId, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// Delete store
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM stores WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

export default router;
