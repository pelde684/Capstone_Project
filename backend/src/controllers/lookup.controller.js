const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { normalizeRole } = require("../utils/roles");
const { isDate } = require("../utils/dates");

// ---- Categories ----
exports.listCategories = asyncHandler(async (req, res) => {
  const [data] = await db.query("SELECT category_id AS id, category_name AS name, description FROM categories ORDER BY category_name");
  res.json({ data });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description = null } = req.body || {};
  if (!name?.trim()) throw new HttpError(400, "name is required");
  const [r] = await db.query("INSERT INTO categories (category_name, description, created_at) VALUES (?,?,NOW())", [name.trim(), description]);
  res.status(201).json({ id: r.insertId, name: name.trim(), description });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body || {};
  const [r] = await db.query(
    "UPDATE categories SET category_name = COALESCE(?, category_name), description = COALESCE(?, description) WHERE category_id = ?",
    [name?.trim() || null, description ?? null, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, "Category not found");
  res.json({ message: "Category updated" });
});

// ---- Storage locations ----
exports.listLocations = asyncHandler(async (req, res) => {
  const showAll = req.user.role === "Admin" && req.query.all === "1";
  const [rows] = await db.query(
    `SELECT l.location_id AS id, l.location_name AS location, l.description, l.capacity, l.is_active AS isActive,
            (SELECT COUNT(*) FROM items i WHERE i.location_id = l.location_id
                AND i.status IN ('STORED','READY_FOR_COLLECTION')) AS used
       FROM storage_locations l ${showAll ? "" : "WHERE l.is_active = 1"} ORDER BY l.location_name`);
  res.json({ data: rows.map((l) => ({ ...l, isActive: !!l.isActive })) });
});

exports.createLocation = asyncHandler(async (req, res) => {
  const { location, description = null, capacity = null } = req.body || {};
  if (!location?.trim()) throw new HttpError(400, "location is required");
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) throw new HttpError(400, "capacity must be a positive integer");
  const [r] = await db.query(
    "INSERT INTO storage_locations (location_name, description, capacity, is_active, created_at) VALUES (?,?,?,1,NOW())",
    [location.trim(), description, capacity]);
  res.status(201).json({ id: r.insertId, location: location.trim(), description, capacity });
});

exports.updateLocation = asyncHandler(async (req, res) => {
  const { location, description, capacity, isActive } = req.body || {};
  const [r] = await db.query(
    `UPDATE storage_locations SET location_name = COALESCE(?, location_name), description = COALESCE(?, description),
            capacity = COALESCE(?, capacity), is_active = COALESCE(?, is_active) WHERE location_id = ?`,
    [location?.trim() || null, description ?? null, capacity ?? null, typeof isActive === "boolean" ? (isActive ? 1 : 0) : null, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, "Location not found");
  res.json({ message: "Location updated" });
});

// ---- Dashboard numbers ----
exports.stats = asyncHandler(async (req, res) => {
  const [byStatus] = await db.query("SELECT status, COUNT(*) AS count FROM items GROUP BY status");
  const [[today]] = await db.query("SELECT COUNT(*) AS count FROM transactions WHERE transaction_time >= CURDATE()");
  const [users] = await db.query("SELECT r.role_name AS role, COUNT(*) AS count FROM users u JOIN roles r ON r.role_id = u.role_id GROUP BY r.role_name");
  res.json({
    itemsByStatus: byStatus,
    transactionsToday: today.count,
    usersByRole: users.map((u) => ({ role: normalizeRole(u.role), count: u.count })),
  });
});

// ---- Hostels (read: everyone, write: Admin) ----
exports.listHostels = asyncHandler(async (req, res) => {
  const showAll = req.user.role === "Admin" && req.query.all === "1";
  const [rows] = await db.query(
    `SELECT h.hostel_id AS id, h.hostel_name AS name, h.is_active AS isActive,
            (SELECT COUNT(*) FROM users u WHERE u.hostel_id = h.hostel_id) AS students
       FROM hostels h ${showAll ? "" : "WHERE h.is_active = 1"} ORDER BY h.hostel_name`);
  res.json({ data: rows.map((h) => ({ ...h, isActive: !!h.isActive })) });
});

exports.createHostel = asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (!name?.trim() || name.trim().length > 100) throw new HttpError(400, "name is required (max 100 characters)");
  const [r] = await db.query("INSERT INTO hostels (hostel_name, is_active, created_at) VALUES (?,1,NOW())", [name.trim()]);
  res.status(201).json({ id: r.insertId, name: name.trim(), isActive: true });
});

exports.updateHostel = asyncHandler(async (req, res) => {
  const { name, isActive } = req.body || {};
  const [r] = await db.query(
    "UPDATE hostels SET hostel_name = COALESCE(?, hostel_name), is_active = COALESCE(?, is_active) WHERE hostel_id = ?",
    [name?.trim() || null, typeof isActive === "boolean" ? (isActive ? 1 : 0) : null, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, "Hostel not found");
  res.json({ message: "Hostel updated" });
});

// ---- Semesters (read: everyone, write: Admin) ----
// A semester is a date range. Drop-offs registered inside it belong to it.
async function checkNoOverlap(start, end, exceptId = 0) {
  const [[clash]] = await db.query(
    "SELECT semester_name FROM semesters WHERE start_date <= ? AND end_date >= ? AND semester_id <> ? LIMIT 1",
    [end, start, exceptId]);
  if (clash) throw new HttpError(409, `These dates overlap with "${clash.semester_name}"`);
}

// Drop-offs registered before the semester existed get linked to it once it covers their date.
async function linkDropOffs(semesterId, start, end) {
  await db.query(
    "UPDATE drop_offs SET semester_id = ? WHERE semester_id IS NULL AND DATE(created_at) BETWEEN ? AND ?",
    [semesterId, start, end]);
}

exports.listSemesters = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.semester_id AS id, s.semester_name AS name,
            DATE_FORMAT(s.start_date, '%Y-%m-%d') AS startDate, DATE_FORMAT(s.end_date, '%Y-%m-%d') AS endDate,
            (CURDATE() BETWEEN s.start_date AND s.end_date) AS isCurrent,
            (SELECT COUNT(*) FROM drop_offs d WHERE d.semester_id = s.semester_id) AS dropOffs
       FROM semesters s ORDER BY s.start_date DESC`);
  res.json({ data: rows.map((s) => ({ ...s, isCurrent: !!s.isCurrent })) });
});

exports.createSemester = asyncHandler(async (req, res) => {
  const { name, startDate, endDate } = req.body || {};
  if (!name?.trim() || name.trim().length > 50) throw new HttpError(400, "name is required (max 50 characters)");
  if (!isDate(startDate) || !isDate(endDate)) throw new HttpError(400, "startDate and endDate must be dates like 2026-07-01");
  if (endDate < startDate) throw new HttpError(400, "endDate must be on or after startDate");
  await checkNoOverlap(startDate, endDate);
  const [r] = await db.query(
    "INSERT INTO semesters (semester_name, start_date, end_date, created_at) VALUES (?,?,?,NOW())",
    [name.trim(), startDate, endDate]);
  await linkDropOffs(r.insertId, startDate, endDate);
  res.status(201).json({ id: r.insertId, name: name.trim(), startDate, endDate });
});

exports.updateSemester = asyncHandler(async (req, res) => {
  const [[cur]] = await db.query(
    `SELECT semester_name AS name, DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate, DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate
       FROM semesters WHERE semester_id = ?`, [req.params.id]);
  if (!cur) throw new HttpError(404, "Semester not found");
  const name = req.body?.name?.trim() || cur.name;
  const startDate = req.body?.startDate ?? cur.startDate;
  const endDate = req.body?.endDate ?? cur.endDate;
  if (name.length > 50) throw new HttpError(400, "name must be at most 50 characters");
  if (!isDate(startDate) || !isDate(endDate)) throw new HttpError(400, "startDate and endDate must be dates like 2026-07-01");
  if (endDate < startDate) throw new HttpError(400, "endDate must be on or after startDate");
  await checkNoOverlap(startDate, endDate, req.params.id);

  await db.query("UPDATE semesters SET semester_name = ?, start_date = ?, end_date = ? WHERE semester_id = ?",
    [name, startDate, endDate, req.params.id]);
  if (startDate !== cur.startDate || endDate !== cur.endDate) {
    // dates changed: re-link drop-offs to match the new range
    await db.query("UPDATE drop_offs SET semester_id = NULL WHERE semester_id = ?", [req.params.id]);
    await linkDropOffs(req.params.id, startDate, endDate);
  }
  res.json({ message: "Semester updated" });
});
