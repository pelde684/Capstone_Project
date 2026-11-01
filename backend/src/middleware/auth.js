const jwt = require("jsonwebtoken");
const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { normalizeRole } = require("../utils/roles");

// Verifies the JWT and re-checks the account in the DB, so a disabled
// user loses access immediately instead of when the token expires.
exports.authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) throw new HttpError(401, "Authentication required");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }

  const [rows] = await db.query(
    `SELECT u.user_id AS id, u.full_name AS name, u.email, u.student_id AS studentId,
            u.is_active AS isActive, r.role_name AS role
       FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.user_id = ?`,
    [payload.id]
  );
  const user = rows[0];
  if (!user || !user.isActive) throw new HttpError(401, "Account not found or disabled");

  user.role = normalizeRole(user.role);
  req.user = user;
  next();
});

// Role-based access control: authorize("Operator", "Admin")
exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : next(new HttpError(403, "You do not have permission to do this"));
