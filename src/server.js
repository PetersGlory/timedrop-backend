
const app = require('./app');
const { sequelize, syncDatabase } = require('./models');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Add this at the very top of your server.js file, before any database connections
  console.log('=== DATABASE CONFIG DEBUG ===');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('==============================');
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    // Sync database models
    await syncDatabase();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}); 