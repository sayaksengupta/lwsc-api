const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const shareRoutes = require('./routes/share');
const painRoutes = require('./routes/pain');
const calendarRoutes = require('./routes/calendar');
const hydrationRoutes = require('./routes/hydration');
const moodRoutes = require('./routes/mood');
const analyticsRoutes = require('./routes/analytics');
const rewardsRoutes = require('./routes/rewards');
const connectionsRoutes = require('./routes/connections');
const educationRoutes = require('./routes/education');
const emergencyRoutes = require('./routes/emergency');
const facilitiesRoutes = require('./routes/facilities');
const settingsRoutes = require('./routes/settings');
const homeRoutes = require('./routes/home');


const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/share', shareRoutes);
app.use('/api/v1/pain', painRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/hydration', hydrationRoutes);
app.use('/api/v1/mood', moodRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/rewards', rewardsRoutes);
app.use('/api/v1/connections', connectionsRoutes);
app.use('/api/v1/education', educationRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/facilities', facilitiesRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/home', homeRoutes);
// ... mount all

app.use(errorHandler);

module.exports = app;