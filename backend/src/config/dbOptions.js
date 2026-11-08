// Connection settings shared by the app (db.js) and `npm run migrate`.
// Locally nothing extra is needed. For an online database (e.g. TiDB Cloud) set in .env:
//   DB_SSL=true            - the connection is encrypted (online databases require this)
//   DB_TIMEZONE=+06:00     - dates and shift hours are in Bhutan time even if the server runs in UTC
const ssl = /^(1|true|yes)$/i.test(process.env.DB_SSL || "") ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined;
const timezone = process.env.DB_TIMEZONE || undefined;

module.exports = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ...(ssl && { ssl }),
  ...(timezone && { timezone }),
};
module.exports.timezone = timezone;
