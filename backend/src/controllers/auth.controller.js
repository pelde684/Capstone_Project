const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { normalizeRole } = require("../utils/roles");

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
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
  res.json({ token, user: publicUser(user) });
});

exports.me = (req, res) => res.json({ user: publicUser(req.user) });

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
