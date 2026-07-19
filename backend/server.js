require('dotenv').config();
const express = require('express');
const cors = require('cors');
const os = require('os');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const itemsRoutes = require('./routes/items');
const activitiesRoutes = require('./routes/activities');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    instance: process.env.INSTANCE_ID || os.hostname(),
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Terjadi kesalahan pada server!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Instance: ${process.env.INSTANCE_ID || os.hostname()}`);
});
