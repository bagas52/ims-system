const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, checkRole, logActivity } = require('../middleware/auth');

// GET /api/items/stats/summary
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const totalStats = await db.query(`
      SELECT 
        COUNT(*) as total_items, 
        SUM(stok) as total_stok, 
        SUM(harga * stok) as total_value 
      FROM items
    `);
    
    const categoryStats = await db.query(`
      SELECT kategori, COUNT(*) as count, SUM(stok) as stok, SUM(harga * stok) as value
      FROM items 
      GROUP BY kategori
    `);

    res.json({
      totals: totalStats.rows[0],
      byCategory: categoryStats.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/export/csv
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM items ORDER BY id ASC');
    const items = result.rows;
    
    if (items.length === 0) {
      return res.status(404).send('No data to export');
    }

    const headers = Object.keys(items[0]).join(',');
    const rows = items.map(item => Object.values(item).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('items.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items
router.get('/', authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { search, kategori, status, sort = 'created_at', order = 'DESC' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let queryParams = [];

    if (search) {
      queryParams.push(`%${search}%`);
      whereClauses.push(`nama ILIKE $${queryParams.length}`);
    }
    if (kategori) {
      queryParams.push(kategori);
      whereClauses.push(`kategori = $${queryParams.length}`);
    }
    if (status) {
      queryParams.push(status);
      whereClauses.push(`status = $${queryParams.length}`);
    }

    let whereSql = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
    
    // Validate sort column to prevent SQL injection
    const validSortColumns = ['id', 'nama', 'kategori', 'harga', 'stok', 'status', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) FROM items ${whereSql}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    queryParams.push(limit, offset);
    const query = `
      SELECT * FROM items 
      ${whereSql} 
      ORDER BY ${sortColumn} ${sortOrder} 
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

// GET /api/items/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items (Admin/Manager)
router.post('/', authenticateToken, checkRole(['Admin', 'Manager']), logActivity('CREATE_ITEM', 'items'), async (req, res) => {
  const { nama, kategori, deskripsi, harga, stok, status } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO items (nama, kategori, deskripsi, harga, stok, status, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nama, kategori, deskripsi, harga || 0, stok || 0, status || 'active', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/items/:id (Admin/Manager)
router.put('/:id', authenticateToken, checkRole(['Admin', 'Manager']), logActivity('UPDATE_ITEM', 'items'), async (req, res) => {
  const { nama, kategori, deskripsi, harga, stok, status } = req.body;
  try {
    const result = await db.query(
      `UPDATE items SET 
        nama = COALESCE($1, nama), 
        kategori = COALESCE($2, kategori), 
        deskripsi = COALESCE($3, deskripsi), 
        harga = COALESCE($4, harga), 
        stok = COALESCE($5, stok), 
        status = COALESCE($6, status), 
        updated_at = NOW() 
       WHERE id = $7 RETURNING *`,
      [nama, kategori, deskripsi, harga, stok, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items/:id (soft delete - Admin only)
router.delete('/:id', authenticateToken, checkRole(['Admin']), logActivity('DELETE_ITEM', 'items'), async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE items SET status = 'inactive', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item tidak ditemukan' });
    res.json({ message: 'Item berhasil di-nonaktifkan', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
