const QRCode = require("qrcode");
const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/pagination");
const { STATUS } = require("../utils/status");
const { addDateRange } = require("../utils/dates");
const svc = require("../services/dropOffService");
const { ITEM_SELECT, ITEM_JOINS, present, getItemById } = require("../services/itemService");

const isStaff = (user) => user.role === "Operator" || user.role === "Admin";

// Owner, operator or admin may see an item; other students may not.
async function loadAuthorized(req) {
  const item = await getItemById(req.params.id);
  if (!item) throw new HttpError(404, "Item not found");
  if (!isStaff(req.user) && item.ownerId !== req.user.id) throw new HttpError(403, "This item belongs to another student");
  return item;
}

// Single-item shortcut: creates a drop-off containing one item (use POST /drop-offs for several items).
exports.create = asyncHandler(async (req, res) => {
  const { name, description = null, categoryId } = req.body || {};
  if (!req.file) throw new HttpError(400, "A photograph of the item is required (field name: photo)");
  const spec = svc.parseItems({ body: { items: [{ name, description, categoryId, quantity: req.body?.quantity }] } });
  const r = await svc.createDropOff(req.user, spec, { 0: req.file.buffer });
  res.status(201).json({ id: r.itemIds[0], dropOffId: r.dropOffId, qrValue: r.qrValue, status: STATUS.REGISTERED });
});

exports.listMine = asyncHandler(async (req, res) => {
  const [rows] = await db.query(`${ITEM_SELECT} WHERE i.owner_id = ? ORDER BY i.registered_at DESC, i.item_id DESC`, [req.user.id]);
  res.json({ data: rows.map(present) });
});

// Operator/Admin: search across all items
exports.listAll = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = [];
  const params = [];
  if (req.query.status) { where.push("i.status = ?"); params.push(req.query.status); }
  if (req.query.ownerId) { where.push("i.owner_id = ?"); params.push(req.query.ownerId); }
  if (req.query.locationId) { where.push("i.location_id = ?"); params.push(req.query.locationId); }
  if (req.query.categoryId) { where.push("i.category_id = ?"); params.push(req.query.categoryId); }
  if (req.query.hostelId) { where.push("u.hostel_id = ?"); params.push(req.query.hostelId); }
  if (req.query.semesterId) { where.push("d.semester_id = ?"); params.push(req.query.semesterId); }
  addDateRange(req.query, "i.registered_at", where, params);
  if (req.query.q) {
    where.push("(i.item_name LIKE ? OR u.full_name LIKE ? OR u.student_id LIKE ?)");
    params.push(...Array(3).fill(`%${req.query.q}%`));
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total ${ITEM_JOINS} ${clause}`, params);
  const [rows] = await db.query(
    `${ITEM_SELECT} ${clause} ORDER BY i.registered_at DESC, i.item_id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ data: rows.map(present), page, limit, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const item = await loadAuthorized(req);
  const [[qr]] = await db.query("SELECT qr_value AS qrValue, generated_at AS generatedAt, is_active AS isActive FROM qr_codes WHERE drop_off_id = ?", [item.dropOffId]);
  const result = { ...present(item), qr: qr ? { ...qr, isActive: !!qr.isActive } : null };
  if (isStaff(req.user)) {
    const [history] = await db.query(
      `SELECT h.history_id AS id, h.old_status AS oldStatus, h.new_status AS newStatus, h.remarks,
              h.changed_at AS changedAt, u.full_name AS changedByName
         FROM item_status_history h JOIN users u ON u.user_id = h.changed_by
        WHERE h.item_id = ? ORDER BY h.changed_at, h.history_id`, [item.id]);
    result.history = history;
  }
  res.json(result);
});

// JSON with a data-URL by default; add ?format=png to get the raw image (for printing).
exports.getQr = asyncHandler(async (req, res) => {
  const item = await loadAuthorized(req);
  const [[qr]] = await db.query("SELECT qr_value FROM qr_codes WHERE drop_off_id = ? AND is_active = 1", [item.dropOffId]);
  if (!qr) throw new HttpError(404, "No active QR code for this item");

  if (req.query.format === "png") {
    return res.type("png").send(await QRCode.toBuffer(qr.qr_value, { width: 400, margin: 2 }));
  }
  res.json({ itemId: item.id, qrValue: qr.qr_value, dataUrl: await QRCode.toDataURL(qr.qr_value, { width: 400, margin: 2 }) });
});

// Student (owner) or Admin withdraws ONE item before it is handed in (row stays, status CANCELLED).
// The drop-off QR stops working only when every item in it is cancelled.
exports.cancel = asyncHandler(async (req, res) => {
  const item = await loadAuthorized(req);
  if (item.status !== STATUS.REGISTERED) throw new HttpError(409, "Only items that have not been deposited can be cancelled");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("UPDATE items SET status = ?, updated_at = NOW() WHERE item_id = ?", [STATUS.CANCELLED, item.id]);
    const [[{ n }]] = await conn.query("SELECT COUNT(*) AS n FROM items WHERE drop_off_id = ? AND status <> ?", [item.dropOffId, STATUS.CANCELLED]);
    if (!n) await conn.query("UPDATE qr_codes SET is_active = 0 WHERE drop_off_id = ?", [item.dropOffId]);
    await conn.query(
      "INSERT INTO item_status_history (item_id, changed_by, old_status, new_status, remarks, changed_at) VALUES (?,?,?,?,?,NOW())",
      [item.id, req.user.id, STATUS.REGISTERED, STATUS.CANCELLED, "Registration cancelled"]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  res.json({ message: "Item cancelled", status: STATUS.CANCELLED });
});
