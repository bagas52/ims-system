const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, checkRole, logActivity } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Email atau password salah, atau akun tidak aktif' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nama: user.nama },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    db.query(`INSERT INTO activity_logs (user_id, action, detail, ip_address) VALUES ($1, $2, $3, $4)`, 
      [user.id, 'LOGIN', 'User login berhasil', req.ip]);

    delete user.password;
    res.json({ token, user });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register (Admin only)
router.post('/register', authenticateToken, checkRole(['Admin']), logActivity('REGISTER_USER', 'users'), async (req, res) => {
  const { nama, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, nama, email, role, is_active, created_at',
      [nama, email, hashedPassword, role || 'Staff']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email sudah terdaftar' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, nama, email, role, is_active, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, logActivity('CHANGE_PASSWORD', 'users'), async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const result = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Password lama tidak sesuai' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, req.user.id]);
    
    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
