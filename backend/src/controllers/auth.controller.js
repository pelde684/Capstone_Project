const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const crypto = require("crypto");
const { normalizeRole } = require("../utils/roles");

const ROLES = ["Student", "Operator", "Admin"];
const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, studentId: u.studentId, role: u.role });

// identifier = email OR student ID
exports.login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) throw new HttpError(400, "Identifier and password are required");

  const [rows] = await db.query(
    `SELECT u.user_id AS id, u.full_name AS name, u.email, u.student_id AS studentId,
            u.password_hash AS passwordHash, u.is_active AS isActive, r.role_name AS role
       FROM users u JOIN roles r ON r.role_id = u.role_id
      WHERE u.email = ? OR u.student_id = ? LIMIT 1`,
    [identifier, identifier]
  );
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, "Invalid credentials");
  if (!user.isActive) throw new HttpError(403, "This account has been disabled");

  user.role = normalizeRole(user.role);
  res.json({ token: signToken(user), user: publicUser(user) });
});

// Self sign-up from the shared Register page. Logs the new user in straight away (same reply as login).
// Body: { name, email, password, role: Student|Operator|Admin, studentId? (students), hostelId?, hostelRoomId?, departmentId?, staffCode? }
// If STAFF_SIGNUP_CODE is set in .env, signing up as Operator or Admin needs that code - set it on the live site
// so a stranger cannot make themselves an admin. Without it (local testing) anyone can pick any role.
const sameText = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const given = (v) => v !== undefined && v !== null && v !== "";

exports.register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = ROLES.find((r) => r.toLowerCase() === String(body.role ?? "Student").trim().toLowerCase());
  const studentId = String(body.studentId ?? "").trim() || null;

  if (!name || name.length > 100) throw new HttpError(400, "Enter your full name (max 100 characters)");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) throw new HttpError(400, "Enter a valid email address");
  if (password.length < 8 || password.length > 72) throw new HttpError(400, "Password must be 8 to 72 characters");
  if (!role) throw new HttpError(400, `role must be one of: ${ROLES.join(", ")}`);
  if (role === "Student" && !/^\d{5,12}$/.test(studentId || "")) throw new HttpError(400, "Enter your student ID (numbers only, e.g. 02250123)");

  if (role !== "Student" && process.env.STAFF_SIGNUP_CODE && !sameText(body.staffCode ?? "", process.env.STAFF_SIGNUP_CODE))
    throw new HttpError(403, "A valid staff code is needed to sign up as an operator or admin");

  let hostelId = null;
  if (role === "Student" && given(body.hostelId)) {
    hostelId = Number(body.hostelId);
    const [[hostel]] = Number.isInteger(hostelId)
      ? await db.query("SELECT hostel_id FROM hostels WHERE hostel_id = ? AND is_active = 1", [hostelId]) : [[]];
    if (!hostel) throw new HttpError(400, "Choose a hostel from the list");
  }

  // Room (or NK kitchen) inside the chosen hostel
  let hostelRoomId = null;
  if (role === "Student" && given(body.hostelRoomId)) {
    if (!hostelId) throw new HttpError(400, "Choose a hostel before choosing a room");
    hostelRoomId = Number(body.hostelRoomId);
    const [[room]] = Number.isInteger(hostelRoomId)
      ? await db.query("SELECT room_id FROM hostel_rooms WHERE room_id = ? AND hostel_id = ?", [hostelRoomId, hostelId]) : [[]];
    if (!room) throw new HttpError(400, "Choose a room from the list for that hostel");
  }

  let departmentId = null;
  if (role === "Student" && given(body.departmentId)) {
    departmentId = Number(body.departmentId);
    const [[dept]] = Number.isInteger(departmentId)
      ? await db.query("SELECT department_id FROM departments WHERE department_id = ? AND is_active = 1", [departmentId]) : [[]];
    if (!dept) throw new HttpError(400, "Choose a programme from the list");
  }

  const [[taken]] = await db.query("SELECT email, student_id AS studentId FROM users WHERE email = ? OR (student_id IS NOT NULL AND student_id = ?) LIMIT 1",
    [email, studentId]);
  if (taken) throw new HttpError(409, taken.email === email ? "An account with this email already exists - log in instead" : "An account with this student ID already exists - log in instead");

  const [[roleRow]] = await db.query("SELECT role_id FROM roles WHERE UPPER(role_name) = UPPER(?)", [role]);
  if (!roleRow) throw new HttpError(500, `Role "${role}" is missing from the roles table - run: npm run seed`);

  const [r] = await db.query(
    `INSERT INTO users (role_id, student_id, full_name, email, password_hash, hostel_id, room_id, department_id, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,1,NOW(),NOW())`,
    [roleRow.role_id, role === "Student" ? studentId : null, name, email, await bcrypt.hash(password, 10), hostelId, hostelRoomId, departmentId]);

  const user = { id: r.insertId, name, email, studentId: role === "Student" ? studentId : null, role };
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// Active departments for the Register page (public, names only)
exports.departments = asyncHandler(async (req, res) => {
  const [rows] = await db.query("SELECT department_id AS id, department_name AS name FROM departments WHERE is_active = 1 ORDER BY department_name");
  res.json({ data: rows });
});

// Active hostels for the Register page (public, names only)
exports.hostels = asyncHandler(async (req, res) => {
  const [rows] = await db.query("SELECT hostel_id AS id, hostel_name AS name FROM hostels WHERE is_active = 1 ORDER BY hostel_name");
  res.json({ data: rows });
});

// Rooms (and NK kitchens) of one hostel for the Register page (public)
exports.hostelRooms = asyncHandler(async (req, res) => {
  const hostelId = Number(req.params.hostelId);
  if (!Number.isInteger(hostelId)) throw new HttpError(400, "Invalid hostel");
  const [rows] = await db.query(
    `SELECT room_id AS id, room_no AS roomNo, room_type AS type
       FROM hostel_rooms WHERE hostel_id = ? ORDER BY room_type, CAST(room_no AS UNSIGNED)`, [hostelId]);
  res.json({ data: rows });
});

// Also says which department the user is in and which storage room that department uses
exports.me = (req, res) => {
  const { departmentId = null, department = null, roomId = null, room = null } = req.user;
  res.json({ user: { ...publicUser(req.user), departmentId, department, roomId, room } });
};

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 8)
    throw new HttpError(400, "Current password and a new password of at least 8 characters are required");

  const [rows] = await db.query("SELECT password_hash FROM users WHERE user_id = ?", [req.user.id]);
  if (!(await bcrypt.compare(currentPassword, rows[0].password_hash)))
    throw new HttpError(401, "Current password is incorrect");

  await db.query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?", [
    await bcrypt.hash(newPassword, 10), req.user.id,
  ]);
  res.json({ message: "Password updated" });
});
