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
const adminRoutes = require('./routes/admin.routes');
const walletRoutes = require('./routes/wallet.routes')
const errorHandler = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/admin', adminRoutes);

// Register Swagger docs
setupSwagger(app);

// Error handling middleware
app.use(errorHandler);

module.exports = app;