require("dotenv").config();

const required = ["DB_USER", "DB_NAME", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(", ")} (copy .env.example to .env)`);
  process.exit(1);
}

const app = require("./src/app");
const db = require("./src/config/db");

const PORT = process.env.PORT || 5000;

db.query("SELECT 1")
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("Could not connect to MySQL:", err.message);
    process.exit(1);
  });
