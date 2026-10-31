const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/pagination");
const { addDateRange } = require("../utils/dates");
const { uploadLostFoundPhoto, signedPhotoUrl, destroyPhoto } = require("../utils/photo");

// Lost and found (meeting 9).
//  - Anyone logged in reports something LOST (looking for it) or FOUND (handing it in), optionally with a photo.
//  - Everyone can browse open FOUND reports, so a student can recognise their own belonging.
//  - Staff match a LOST report to a FOUND one (the found item is then claimed by the student who lost it),
//    record the handover (RETURNED), or close reports that are no longer needed.

const TYPES = ["LOST", "FOUND"];
const STATUSES = ["OPEN", "MATCHED", "RETURNED", "CLOSED"];
const DONE = ["RETURNED", "CLOSED"];
const isStaff = (u) => u.role === "Operator" || u.role === "Admin";

const SELECT = `
  SELECT r.lost_found_id AS id, r.report_type AS reportType, r.item_name AS itemName, r.description,
         r.category_id AS categoryId, c.category_name AS categoryName, r.location_text AS location,
         r.photo_public_id AS photoPublicId, r.status,
         r.reported_by AS reportedById, rb.full_name AS reportedByName, rb.student_id AS reportedByStudentId,
         r.related_item_id AS relatedItemId, i.item_name AS relatedItemName,
         r.claimed_by AS claimedById, cb.full_name AS claimedByName, cb.student_id AS claimedByStudentId,
         r.reported_at AS reportedAt, r.updated_at AS updatedAt, r.resolved_at AS resolvedAt
    FROM lost_found_items r
    JOIN users rb ON rb.user_id = r.reported_by
    LEFT JOIN categories c ON c.category_id = r.category_id
    LEFT JOIN items i ON i.item_id = r.related_item_id
    LEFT JOIN users cb ON cb.user_id = r.claimed_by`;

// Photo id -> signed link. `brief` hides who reported it (used for the public board of found items).
function present(row, brief = false) {
  if (!row) return null;
  const { photoPublicId, ...rest } = row;
  const out = { ...rest, photoUrl: signedPhotoUrl(photoPublicId) };
  if (brief) {
    for (const k of ["reportedById", "reportedByName", "reportedByStudentId", "claimedById", "claimedByName", "claimedByStudentId", "relatedItemId", "relatedItemName"]) delete out[k];
  }
  return out;
}

const text = (v, field, max, required) => {
  if (v === undefined || v === null || (typeof v === "string" && !v.trim())) {
    if (required) throw new HttpError(400, `${field} is required`);
    return null;
  }
  if (typeof v !== "string" || v.trim().length > max) throw new HttpError(400, `${field} must be text of at most ${max} characters`);
  return v.trim();
};
const optionalId = (v, field) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, `${field} must be a valid id`);
  return n;
};

async function loadOne(id) {
  const [[row]] = await db.query(`${SELECT} WHERE r.lost_found_id = ?`, [id]);
  return row || null;
}

// ---- Everyone logged in ----

// multipart/form-data (or JSON without a photo):
//   reportType = LOST | FOUND, itemName, description?, categoryId?, location?, relatedItemId? (students: one of their own items)
//   photo = optional image file
exports.create = asyncHandler(async (req, res) => {
  const reportType = String(req.body?.reportType || "").trim().toUpperCase(); // ignores stray spaces and line breaks
  if (!TYPES.includes(reportType)) throw new HttpError(400, "reportType must be LOST or FOUND");
  const itemName = text(req.body?.itemName, "itemName", 150, true);
  const description = text(req.body?.description, "description", 2000, false);
  const location = text(req.body?.location, "location", 150, false);
  const categoryId = optionalId(req.body?.categoryId, "categoryId");
  const relatedItemId = optionalId(req.body?.relatedItemId, "relatedItemId");

  if (categoryId) {
    const [[cat]] = await db.query("SELECT category_id FROM categories WHERE category_id = ?", [categoryId]);
    if (!cat) throw new HttpError(400, "Category not found");
  }
  if (relatedItemId) {
    const [[item]] = await db.query("SELECT owner_id FROM items WHERE item_id = ?", [relatedItemId]);
    if (!item) throw new HttpError(404, "Item not found");
    if (!isStaff(req.user) && item.owner_id !== req.user.id) throw new HttpError(403, "You can only link your own items");
  }

  let photoId = null;
  if (req.file) photoId = (await uploadLostFoundPhoto(req.file.buffer)).public_id;
  try {
    const [r] = await db.query(
      `INSERT INTO lost_found_items (report_type, item_name, description, category_id, location_text, photo_public_id,
                                     reported_by, related_item_id, status, reported_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?, 'OPEN', NOW(), NOW())`,
      [reportType, itemName, description, categoryId, location, photoId, req.user.id, relatedItemId]);
    res.status(201).json(present(await loadOne(r.insertId)));
  } catch (err) {
    if (photoId) await destroyPhoto(photoId).catch(() => {});
    throw err;
  }
});

// Public board: open FOUND reports (no reporter details), newest first. Filters: q, categoryId
exports.listFound = asyncHandler(async (req, res) => {
  const where = ["r.report_type = 'FOUND'", "r.status = 'OPEN'"];
  const params = [];
  if (req.query.q) { where.push("(r.item_name LIKE ? OR r.description LIKE ?)"); params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
  if (req.query.categoryId) { where.push("r.category_id = ?"); params.push(req.query.categoryId); }
  const [rows] = await db.query(`${SELECT} WHERE ${where.join(" AND ")} ORDER BY r.reported_at DESC LIMIT 100`, params);
  res.json({ data: rows.map((r) => present(r, true)) });
});

// The caller's own reports, plus found items that were matched to them
exports.listMine = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `${SELECT} WHERE r.reported_by = ? OR r.claimed_by = ? ORDER BY r.reported_at DESC`, [req.user.id, req.user.id]);
  res.json({ data: rows.map((r) => present(r)) });
});

// Staff, the reporter, or the student it was matched to
exports.getOne = asyncHandler(async (req, res) => {
  const row = await loadOne(req.params.id);
  if (!row) throw new HttpError(404, "Report not found");
  const mine = row.reportedById === req.user.id || row.claimedById === req.user.id;
  if (!isStaff(req.user) && !mine) {
    // other students may only see open FOUND reports, without personal details
    if (row.reportType === "FOUND" && row.status === "OPEN") return res.json(present(row, true));
    throw new HttpError(403, "You cannot view this report");
  }
  res.json(present(row));
});

// ---- Staff ----

// All reports. Filters: reportType, status, q (item, reporter name or student ID), from, to. Also counts per status.
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = [];
  const params = [];
  if (req.query.reportType) {
    req.query.reportType = String(req.query.reportType).trim().toUpperCase();
    if (!TYPES.includes(req.query.reportType)) throw new HttpError(400, "reportType must be LOST or FOUND");
    where.push("r.report_type = ?"); params.push(req.query.reportType);
  }
  if (req.query.status) {
    if (!STATUSES.includes(req.query.status)) throw new HttpError(400, `status must be one of: ${STATUSES.join(", ")}`);
    where.push("r.status = ?"); params.push(req.query.status);
  }
  if (req.query.q) {
    where.push("(r.item_name LIKE ? OR rb.full_name LIKE ? OR rb.student_id LIKE ?)");
    params.push(...Array(3).fill(`%${req.query.q}%`));
  }
  addDateRange(req.query, "r.reported_at", where, params);
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM lost_found_items r JOIN users rb ON rb.user_id = r.reported_by ${clause}`, params);
  const [rows] = await db.query(`${SELECT} ${clause} ORDER BY r.reported_at DESC, r.lost_found_id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [counts] = await db.query("SELECT report_type AS t, status, COUNT(*) AS n FROM lost_found_items GROUP BY report_type, status");
  const byStatus = { LOST: Object.fromEntries(STATUSES.map((s) => [s, 0])), FOUND: Object.fromEntries(STATUSES.map((s) => [s, 0])) };
  for (const c of counts) byStatus[c.t][c.status] = Number(c.n);
  res.json({ data: rows.map((r) => present(r)), page, limit, total, byStatus });
});

// Body: { lostId, foundId } - both must be OPEN. The found item is claimed by the student who lost it.
exports.match = asyncHandler(async (req, res) => {
  const lostId = optionalId(req.body?.lostId, "lostId");
  const foundId = optionalId(req.body?.foundId, "foundId");
  if (!lostId || !foundId) throw new HttpError(400, "lostId and foundId are required");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      "SELECT lost_found_id AS id, report_type AS t, status, reported_by, related_item_id FROM lost_found_items WHERE lost_found_id IN (?, ?) FOR UPDATE",
      [lostId, foundId]);
    const lost = rows.find((r) => r.id === lostId);
    const found = rows.find((r) => r.id === foundId);
    if (!lost || !found) throw new HttpError(404, "Report not found");
    if (lost.t !== "LOST") throw new HttpError(400, `Report ${lostId} is not a LOST report`);
    if (found.t !== "FOUND") throw new HttpError(400, `Report ${foundId} is not a FOUND report`);
    if (lost.status !== "OPEN" || found.status !== "OPEN") throw new HttpError(409, "Both reports must still be open to be matched");

    await conn.query(
      "UPDATE lost_found_items SET status = 'MATCHED', claimed_by = ?, related_item_id = COALESCE(related_item_id, ?), updated_at = NOW() WHERE lost_found_id = ?",
      [lost.reported_by, lost.related_item_id, foundId]);
    await conn.query(
      "UPDATE lost_found_items SET status = 'MATCHED', claimed_by = ?, updated_at = NOW() WHERE lost_found_id = ?",
      [lost.reported_by, lostId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  res.json({ lost: present(await loadOne(lostId)), found: present(await loadOne(foundId)) });
});

// Body: { status, claimedByStudentId? }
//  - RETURNED: the item was handed to its owner. A FOUND item needs an owner: already matched,
//    or give claimedByStudentId (the owner came to the desk and recognised it).
//  - CLOSED: no longer needed (e.g. the student found it themselves). RETURNED and CLOSED are final.
exports.update = asyncHandler(async (req, res) => {
  const row = await loadOne(req.params.id);
  if (!row) throw new HttpError(404, "Report not found");
  if (DONE.includes(row.status)) throw new HttpError(409, `This report is already ${row.status.toLowerCase()} and can no longer be changed`);

  const status = String(req.body?.status || "").trim().toUpperCase();
  if (!STATUSES.includes(status)) throw new HttpError(400, `status must be one of: ${STATUSES.join(", ")}`);
  if (status === "MATCHED") throw new HttpError(400, "Use POST /lost-found/match to match a lost report with a found one");

  let claimedBy = row.claimedById;
  const sid = text(req.body?.claimedByStudentId, "claimedByStudentId", 30, false);
  if (sid) {
    const [[owner]] = await db.query(
      "SELECT u.user_id FROM users u JOIN roles ro ON ro.role_id = u.role_id WHERE u.student_id = ? AND UPPER(ro.role_name) = 'STUDENT'", [sid]);
    if (!owner) throw new HttpError(404, `No student with ID ${sid}`);
    claimedBy = owner.user_id;
  }
  if (status === "RETURNED" && row.reportType === "FOUND" && !claimedBy)
    throw new HttpError(400, "Say who the item was returned to (claimedByStudentId)");

  await db.query(
    `UPDATE lost_found_items SET status = ?, claimed_by = ?, resolved_at = ${DONE.includes(status) ? "NOW()" : "NULL"}, updated_at = NOW()
      WHERE lost_found_id = ?`,
    [status, claimedBy, req.params.id]);
  res.json(present(await loadOne(req.params.id)));
});
