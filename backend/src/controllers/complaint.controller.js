const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/pagination");
const { addDateRange } = require("../utils/dates");

// Complaints (meeting 9): a student raises a complaint, optionally about one of their items.
// The admin forwards it to a person or department, works on it and resolves it.
// The student can always see its status and who it was forwarded to.

const STATUSES = ["OPEN", "FORWARDED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const DONE = ["RESOLVED", "CLOSED"];

const SELECT = `
  SELECT c.complaint_id AS id, c.subject, c.description, c.status,
         c.forwarded_to AS forwardedTo, c.resolution,
         c.created_at AS createdAt, c.updated_at AS updatedAt, c.resolved_at AS resolvedAt,
         c.complainant_id AS studentUserId, u.full_name AS studentName, u.student_id AS studentId,
         h.hostel_name AS studentHostel,
         c.item_id AS itemId, i.item_name AS itemName,
         c.handled_by AS handledById, a.full_name AS handledByName
    FROM complaints c
    JOIN users u ON u.user_id = c.complainant_id
    LEFT JOIN hostels h ON h.hostel_id = u.hostel_id
    LEFT JOIN items i ON i.item_id = c.item_id
    LEFT JOIN users a ON a.user_id = c.handled_by`;

const text = (v, field, max, required) => {
  if (v === undefined || v === null || (typeof v === "string" && !v.trim())) {
    if (required) throw new HttpError(400, `${field} is required`);
    return null;
  }
  if (typeof v !== "string" || v.trim().length > max) throw new HttpError(400, `${field} must be text of at most ${max} characters`);
  return v.trim();
};

async function loadOne(id) {
  const [[row]] = await db.query(`${SELECT} WHERE c.complaint_id = ?`, [id]);
  return row || null;
}

// ---- Student ----

// Body: { subject, description, itemId? }  (itemId must be one of the student's own items)
exports.create = asyncHandler(async (req, res) => {
  const subject = text(req.body?.subject, "subject", 150, true);
  const description = text(req.body?.description, "description", 2000, true);
  let itemId = req.body?.itemId ?? null;
  if (itemId !== null && itemId !== "") {
    itemId = Number(itemId);
    if (!Number.isInteger(itemId) || itemId < 1) throw new HttpError(400, "itemId must be a valid item id");
    const [[item]] = await db.query("SELECT owner_id FROM items WHERE item_id = ?", [itemId]);
    if (!item) throw new HttpError(404, "Item not found");
    if (item.owner_id !== req.user.id) throw new HttpError(403, "You can only complain about your own items");
  } else {
    itemId = null;
  }

  const [r] = await db.query(
    `INSERT INTO complaints (complainant_id, item_id, subject, description, status, created_at, updated_at)
     VALUES (?,?,?,?, 'OPEN', NOW(), NOW())`,
    [req.user.id, itemId, subject, description]);
  res.status(201).json(await loadOne(r.insertId));
});

exports.listMine = asyncHandler(async (req, res) => {
  const [rows] = await db.query(`${SELECT} WHERE c.complainant_id = ? ORDER BY c.created_at DESC, c.complaint_id DESC`, [req.user.id]);
  res.json({ data: rows });
});

// Owner or staff
exports.getOne = asyncHandler(async (req, res) => {
  const row = await loadOne(req.params.id);
  if (!row) throw new HttpError(404, "Complaint not found");
  if (req.user.role === "Student" && row.studentUserId !== req.user.id) throw new HttpError(403, "This complaint belongs to another student");
  res.json(row);
});

// ---- Admin ----

// Filters: status, q (subject, student name or student ID), from, to (dates, inclusive). Also returns counts per status.
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = [];
  const params = [];
  if (req.query.status) {
    if (!STATUSES.includes(req.query.status)) throw new HttpError(400, `status must be one of: ${STATUSES.join(", ")}`);
    where.push("c.status = ?"); params.push(req.query.status);
  }
  if (req.query.q) {
    where.push("(c.subject LIKE ? OR u.full_name LIKE ? OR u.student_id LIKE ?)");
    params.push(...Array(3).fill(`%${req.query.q}%`));
  }
  addDateRange(req.query, "c.created_at", where, params);
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const from = "FROM complaints c JOIN users u ON u.user_id = c.complainant_id";

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${from} ${clause}`, params);
  const [data] = await db.query(`${SELECT} ${clause} ORDER BY c.created_at DESC, c.complaint_id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [counts] = await db.query("SELECT status, COUNT(*) AS n FROM complaints GROUP BY status");
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const c of counts) byStatus[c.status] = Number(c.n);
  res.json({ data, page, limit, total, byStatus });
});

// Body: { status?, forwardedTo?, resolution? }
//  - FORWARDED needs forwardedTo (a person or department, e.g. "Hostel warden")
//  - RESOLVED needs a resolution (what was done)
//  - CLOSED complaints can no longer be changed
exports.update = asyncHandler(async (req, res) => {
  const current = await loadOne(req.params.id);
  if (!current) throw new HttpError(404, "Complaint not found");
  if (current.status === "CLOSED") throw new HttpError(409, "This complaint is closed and can no longer be changed");

  const status = req.body?.status ?? current.status;
  if (!STATUSES.includes(status)) throw new HttpError(400, `status must be one of: ${STATUSES.join(", ")}`);
  const forwardedTo = req.body?.forwardedTo !== undefined ? text(req.body.forwardedTo, "forwardedTo", 150, false) : current.forwardedTo;
  const resolution = req.body?.resolution !== undefined ? text(req.body.resolution, "resolution", 2000, false) : current.resolution;
  if (status === "FORWARDED" && !forwardedTo) throw new HttpError(400, "Say who the complaint is forwarded to (forwardedTo)");
  if (status === "RESOLVED" && !resolution) throw new HttpError(400, "Describe how the complaint was resolved (resolution)");

  // resolved_at is set when it is first resolved or closed, and cleared if it is reopened
  const resolvedAt = DONE.includes(status) ? "COALESCE(resolved_at, NOW())" : "NULL";
  await db.query(
    `UPDATE complaints SET status = ?, forwarded_to = ?, resolution = ?, handled_by = ?, resolved_at = ${resolvedAt}, updated_at = NOW()
      WHERE complaint_id = ?`,
    [status, forwardedTo, resolution, req.user.id, req.params.id]);
  res.json(await loadOne(req.params.id));
});
