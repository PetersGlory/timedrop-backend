const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  database: process.env.DB_NAME || "defaultdb",
  username: process.env.DB_USER || "doadmin",
  password: process.env.DB_PASSWORD || "AVNS_-vhnKgXc0TJqtt3mwwX",
  host: process.env.DB_HOST || "timedroplive-do-user-24108218-0.l.db.ondigitalocean.com",
  port: process.env.DB_PORT || "25060",
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Important for DigitalOcean
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;