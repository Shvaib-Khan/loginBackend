require("dotenv").config();

module.exports = {
  development: {
    client: "mysql2",

    connection: {
      host: "localhost",
      port: 3307,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },

    migrations: {
      directory: "./database/migrations",
      extentions: "cjs",
    },
  },
};
