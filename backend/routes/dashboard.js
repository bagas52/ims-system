const express = require('express');
const router = express.Router();
const os = require('os');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const activeUsersCount = await db.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const itemsCount = await db.query('SELECT COUNT(*), SUM(stok) as total_stok, SUM(harga * stok) as total_value FROM items');
    const todayActivities = await db.query('SELECT COUNT(*) FROM activity_logs WHERE DATE(created_at) = CURRENT_DATE');

    res.json({
      total_users: parseInt(usersCount.rows[0].count),
      active_users: parseInt(activeUsersCount.rows[0].count),
      total_items: parseInt(itemsCount.rows[0].count),
      total_stok: parseInt(itemsCount.rows[0].total_stok) || 0,
      total_value: parseFloat(itemsCount.rows[0].total_value) || 0,
      today_activities: parseInt(todayActivities.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/performance
router.get('/performance', authenticateToken, (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    cpu_usage: process.cpuUsage(),
    instance_id: process.env.INSTANCE_ID || os.hostname(),
    timestamp: new Date()
  });
});

// GET /api/dashboard/chart
router.get('/chart', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
