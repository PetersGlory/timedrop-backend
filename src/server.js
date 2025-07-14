const app = require('./app');
const { sequelize, syncDatabase } = require('./models');

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    // Sync database models
    await syncDatabase();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}); 