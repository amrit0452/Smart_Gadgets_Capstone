const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

let pool;

function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    // Use 127.0.0.1 so Node uses TCP; "localhost" can try a Unix socket and fail against Docker MySQL on Linux CI.
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "neo_gadgets",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

module.exports = { getPool };

