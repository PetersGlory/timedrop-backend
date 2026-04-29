require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import route files
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const marketRoutes = require('./routes/market.routes');
const orderRoutes = require('./routes/order.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const settingsRoutes = require('./routes/settings.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');
const referralRoutes = require('./routes/referral.routes');
const agentRoutes = require('./routes/agent.routes');
const adminRoutes = require('./routes/admin.routes');
const walletRoutes = require('./routes/wallet.routes');
const webhookRoutes = require('./routes/webhook.routes');
const errorHandler = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');
const helmet = require('helmet');

const app = express();

// Middleware
// allowed CORS origin for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'https://timedrop.live',
  'https://www.timedrop.live',
  'https://www.admins.timedrop.live',
  'https://admins.timedrop.live'
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Register Swagger docs
setupSwagger(app);

// Error handling middleware
app.use(errorHandler);

module.exports = app;