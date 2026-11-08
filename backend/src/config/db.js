const mysql = require("mysql2/promise");
const { timezone, ...options } = require("./dbOptions");

const pool = mysql.createPool({
  ...options,
  ...(timezone && { timezone }),
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000, // close idle connections after 1 minute (online databases drop old idle ones anyway)
  enableKeepAlive: true,
});

// NOW(), DATE() and HOUR() in SQL use this time zone, so shifts and reports match local time
// (runs first on every new connection; commands on one connection run in order)
if (timezone) {
  pool.pool.on("connection", (conn) =>
    conn.query("SET time_zone = ?", [timezone], (err) => err && console.error("Could not set time zone:", err.message)));
}

module.exports = pool;
