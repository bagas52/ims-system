const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// GET /api/activities/stats
router.get('/stats', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT action, COUNT(*) as count 
      FROM activity_logs 
      GROUP BY action 
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activities
router.get('/', authenticateToken, checkRole(['Admin', 'Manager']), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { start_date, end_date, user_id, action } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let queryParams = [];

    if (start_date) {
      queryParams.push(start_date);
      whereClauses.push(`a.created_at >= $${queryParams.length}`);
    }
    if (end_date) {
      queryParams.push(end_date);
      whereClauses.push(`a.created_at <= $${queryParams.length}`);
    }
    if (user_id) {
      queryParams.push(user_id);
      whereClauses.push(`a.user_id = $${queryParams.length}`);
    }
    if (action) {
      queryParams.push(action);
      whereClauses.push(`a.action = $${queryParams.length}`);
    }

    let whereSql = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countQuery = `SELECT COUNT(*) FROM activity_logs a ${whereSql}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    queryParams.push(limit, offset);
    const query = `
      SELECT a.*, u.nama as user_nama 
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const result = await db.query(query, queryParams);

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

// DELETE /api/activities (Admin only, older than 30 days)
router.delete('/', authenticateToken, checkRole(['Admin']), async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM activity_logs 
      WHERE created_at < NOW() - INTERVAL '30 days' 
      RETURNING id
    `);
    res.json({ message: `Berhasil menghapus ${result.rows.length} log aktivitas lama` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
