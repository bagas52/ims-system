const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkRole, logActivity } = require('../middleware/auth');

// GET /api/users/stats/summary
router.get('/stats/summary', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users
router.get('/', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT id, nama, email, role, is_active, created_at, updated_at FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    let queryParams = [];

    if (search) {
      query += ' WHERE nama ILIKE $1 OR email ILIKE $1';
      countQuery += ' WHERE nama ILIKE $1 OR email ILIKE $1';
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY id ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    
    const countParams = [...queryParams];
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, countParams);
    
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const result = await db.query('SELECT id, nama, email, role, is_active, created_at, updated_at FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id (Admin only)
router.put('/:id', authenticateToken, checkRole(['Admin']), logActivity('UPDATE_USER', 'users'), async (req, res) => {
  const { nama, role, is_active } = req.body;
  try {
    const result = await db.query(
      'UPDATE users SET nama = COALESCE($1, nama), role = COALESCE($2, role), is_active = COALESCE($3, is_active), updated_at = NOW() WHERE id = $4 RETURNING id, nama, email, role, is_active, updated_at',
      [nama, role, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id (soft delete - Admin only)
router.delete('/:id', authenticateToken, checkRole(['Admin']), logActivity('DELETE_USER', 'users'), async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, nama',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil dinonaktifkan', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
