const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("dachier_live", "postgres", "password", {
  host: "localhost",
  dialect: "postgres",
  port: 5432,
});

// Check if the database is connected or not
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected!");
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });

module.exports = sequelize;
