// Run once after the database exists:  npm run seed
// Safe to re-run: it only adds what is missing (roles are matched ignoring upper/lower case).
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../src/config/db");

(async () => {
  for (const role of ["STUDENT", "OPERATOR", "ADMIN"]) {
    const [[found]] = await db.query("SELECT role_id FROM roles WHERE UPPER(role_name) = ?", [role]);
    if (!found) await db.query("INSERT INTO roles (role_name, description, created_at) VALUES (?,?,NOW())", [role, `${role} role`]);
  }

  const { ADMIN_NAME = "System Admin", ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");

  const [[admin]] = await db.query("SELECT role_id FROM roles WHERE UPPER(role_name) = 'ADMIN'");
  await db.query(
    `INSERT IGNORE INTO users (role_id, full_name, email, password_hash, is_active, created_at, updated_at)
     VALUES (?,?,?,?,1,NOW(),NOW())`,
    [admin.role_id, ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), await bcrypt.hash(ADMIN_PASSWORD, 10)]);

  for (const c of ["Luggage / Bag", "Clothes", "Blanket / Bedding", "Electronics", "Books", "Other"])
    await db.query("INSERT IGNORE INTO categories (category_name, created_at) VALUES (?,NOW())", [c]);
  await db.query(
    "INSERT IGNORE INTO storage_locations (location_name, description, capacity, is_active, created_at) VALUES ('Luggage Room - Shelf A','Main shelf',100,1,NOW())");

  console.log(`Seeded roles, categories, a storage location and admin <${ADMIN_EMAIL}> (existing rows were left untouched)`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
