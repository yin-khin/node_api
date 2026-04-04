// const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize(
//   process.env.DB_NAME || "node_db",
//   process.env.DB_USER || "root",
//   process.env.DB_PASSWORD || "",
//   {
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT || "mysql",
//     logging: false,
//   },
// );

// module.exports = sequelize;
const { Sequelize } = require("sequelize");

console.log("Connecting to DB:", process.env.DB_HOST, process.env.DB_PORT);

const sequelize = new Sequelize(
  process.env.DB_NAME || "node_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // required for Aiven
      },
    },
  },
);

module.exports = sequelize;
