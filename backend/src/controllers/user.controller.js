const bcrypt = require("bcryptjs");
const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/pagination");
const { normalizeRole } = require("../utils/roles");

const ROLES = ["Student", "Operator", "Admin"];

// hostelId from a request: undefined = not given, "" or null = no hostel, otherwise a positive id
function parseHostelId(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "hostelId must be a valid hostel id");
  return id;
}

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = [];
  const params = [];
  if (req.query.role) { where.push("UPPER(r.role_name) = UPPER(?)"); params.push(req.query.role); }
  if (req.query.hostelId) { where.push("u.hostel_id = ?"); params.push(req.query.hostelId); }
  if (req.query.q) {
    where.push("(u.full_name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ?)");
    params.push(...Array(3).fill(`%${req.query.q}%`));
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const from = `FROM users u JOIN roles r ON r.role_id = u.role_id LEFT JOIN hostels h ON h.hostel_id = u.hostel_id ${clause}`;

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${from}`, params);
  const [rows] = await db.query(
    `SELECT u.user_id AS id, u.full_name AS name, u.email, u.student_id AS studentId, u.phone,
            u.hostel_id AS hostelId, h.hostel_name AS hostel,
            u.is_active AS isActive, u.created_at AS createdAt, r.role_name AS role
       ${from} ORDER BY u.created_at DESC, u.user_id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const data = rows.map((u) => ({ ...u, isActive: !!u.isActive, role: normalizeRole(u.role) }));
  res.json({ data, page, limit, total });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role, studentId, phone } = req.body || {};
  const hostelId = parseHostelId(req.body?.hostelId) ?? null;
  if (!name?.trim() || !email?.trim() || !password) throw new HttpError(400, "name, email, password and role are required");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
  if (!ROLES.includes(role)) throw new HttpError(400, `role must be one of: ${ROLES.join(", ")}`);
  if (role === "Student" && !studentId) throw new HttpError(400, "studentId is required for students");

  const [[roleRow]] = await db.query("SELECT role_id FROM roles WHERE UPPER(role_name) = UPPER(?)", [role]);
  if (!roleRow) throw new HttpError(500, `Role "${role}" is missing from the roles table - run: npm run seed`);

  const [result] = await db.query(
    `INSERT INTO users (role_id, student_id, full_name, email, password_hash, phone, hostel_id, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,1,NOW(),NOW())`,
    [roleRow.role_id, studentId || null, name.trim(), email.trim().toLowerCase(), await bcrypt.hash(password, 10), phone || null, hostelId]
  );
  res.status(201).json({ id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), role, studentId: studentId || null, phone: phone || null, hostelId });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, email, studentId, phone } = req.body || {};
  const hostelId = parseHostelId(req.body?.hostelId); // only changed when sent; null removes the hostel
  const sets = ["full_name = COALESCE(?, full_name)", "email = COALESCE(?, email)",
                "student_id = COALESCE(?, student_id)", "phone = COALESCE(?, phone)"];
  const params = [name?.trim() || null, email?.trim().toLowerCase() || null, studentId || null, phone || null];
  if (hostelId !== undefined) { sets.push("hostel_id = ?"); params.push(hostelId); }
  const [result] = await db.query(
    `UPDATE users SET ${sets.join(", ")}, updated_at = NOW() WHERE user_id = ?`,
    [...params, req.params.id]
  );
  if (!result.affectedRows) throw new HttpError(404, "User not found");
  res.json({ message: "User updated" });
});

exports.setStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body || {};
  if (typeof isActive !== "boolean") throw new HttpError(400, "isActive must be true or false");
  if (Number(req.params.id) === req.user.id) throw new HttpError(400, "You cannot change your own status");
  const [result] = await db.query("UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?", [isActive ? 1 : 0, req.params.id]);
  if (!result.affectedRows) throw new HttpError(404, "User not found");
  res.json({ message: isActive ? "User enabled" : "User disabled" });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
  const [result] = await db.query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?", [await bcrypt.hash(password, 10), req.params.id]);
  if (!result.affectedRows) throw new HttpError(404, "User not found");
  res.json({ message: "Password reset" });
});
