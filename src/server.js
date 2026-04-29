require('dotenv').config();

const app = require('./app');
const adminController = require('./controllers/admin.controller');
const payoutController = require('./controllers/payout.controller');
const { sequelize, syncDatabase } = require('./models');
const cron = require('node-cron');

const PORT = process.env.PORT || 3000;

// Initialize cron job
const initCronJobs = () => {
  // Run every 1 minute
  cron.schedule('* * * * *', async () => {
    console.log('Cron job running at:', new Date().toLocaleString());
    
    try {
      // Call your controller function
      await adminController.syncWithdrawals(); // Added await if it's async
      await payoutController.runPrepareCollectionCronjob();
      console.log('✅ Withdrawal sync completed successfully');
    } catch (error) {
      console.error('❌ Error in cron job:', error.message);
      // Optionally: Send error notification or log to error tracking service
    }
  }, {
    scheduled: true,
    timezone: "Africa/Lagos"
  });
  
  console.log('✅ Cron jobs initialized - Running every 1 minute');
};

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync database models
    await syncDatabase();
    console.log('✅ Database models synced successfully.');
    
    // Initialize cron jobs AFTER database is ready
    initCronJobs();
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1); // Exit if database connection fails
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⚠️ SIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});