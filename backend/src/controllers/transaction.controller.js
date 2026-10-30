const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/pagination");
const { STATUS, VERIFICATION, ACTIONS } = require("../utils/status");
const { addDateRange } = require("../utils/dates");

// Records an operator action on ONE item (itemId), several items (itemIds) or a whole
// drop-off (dropOffId = every item in it that can take this action; others are reported in `skipped`).
// Items are locked, so two operators can't process the same item at once; status + history +
// transaction rows are written together or not at all (one transaction row per item).
exports.create = asyncHandler(async (req, res) => {
  const { action, locationId, remarks = null, itemId, itemIds, dropOffId } = req.body || {};
  if (typeof action !== "string" || !Object.hasOwn(ACTIONS, action))
    throw new HttpError(400, `action must be one of: ${Object.keys(ACTIONS).join(", ")}`);
  if (remarks !== null && (typeof remarks !== "string" || remarks.length > 500)) throw new HttpError(400, "remarks must be text of at most 500 characters");

  let ids = Array.isArray(itemIds) ? itemIds : itemId ? [itemId] : null;
  if (ids) {
    ids = [...new Set(ids.map(Number))];
    if (!ids.length || ids.length > 50 || ids.some((n) => !Number.isInteger(n) || n < 1)) throw new HttpError(400, "itemIds must be 1 to 50 valid item ids");
  } else if (!Number.isInteger(Number(dropOffId)) || !dropOffId) {
    throw new HttpError(400, "itemId, itemIds or dropOffId is required");
  }

  const rule = ACTIONS[action];
  let verificationStatus = rule.verification;
  if (rule.requireApproved) {
    verificationStatus = req.body.verificationStatus;
    if (verificationStatus !== VERIFICATION.APPROVED)
      throw new HttpError(422, 'COLLECTION needs verificationStatus "APPROVED". If the item or owner does not match, record a REJECTION instead');
  }
  if (rule.requireRemarks && !remarks?.trim()) throw new HttpError(400, `remarks are required for ${action}`);
  if (rule.needsLocation && !locationId) throw new HttpError(400, "locationId is required to store an item");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const cols = "item_id, drop_off_id, status, location_id";
    let items;
    let skipped = [];
    if (ids) {
      [items] = await conn.query(`SELECT ${cols} FROM items WHERE item_id IN (?) ORDER BY item_id FOR UPDATE`, [ids]);
      if (items.length !== ids.length) throw new HttpError(404, "One or more items were not found");
      const bad = items.filter((i) => !rule.from.includes(i.status));
      if (bad.length) throw new HttpError(409, `Cannot ${action}: ${bad.map((i) => `item ${i.item_id} is ${i.status}`).join(", ")}`);
    } else {
      const [all] = await conn.query(`SELECT ${cols} FROM items WHERE drop_off_id = ? ORDER BY item_id FOR UPDATE`, [dropOffId]);
      if (!all.length) throw new HttpError(404, "Drop-off not found");
      items = all.filter((i) => rule.from.includes(i.status));
      skipped = all.filter((i) => !rule.from.includes(i.status) && i.status !== STATUS.CANCELLED).map((i) => ({ itemId: i.item_id, status: i.status }));
      if (!items.length) throw new HttpError(409, `No item in this drop-off can take ${action}`);
    }

    if (rule.needsLocation) {
      const [[loc]] = await conn.query("SELECT location_id, capacity, is_active FROM storage_locations WHERE location_id = ? FOR UPDATE", [locationId]);
      if (!loc || !loc.is_active) throw new HttpError(400, "Storage location not found or inactive");
      if (loc.capacity !== null) {
        const [[{ used }]] = await conn.query("SELECT COUNT(*) AS used FROM items WHERE location_id = ? AND status IN (?, ?)", [locationId, STATUS.STORED, STATUS.READY]);
        if (used + items.length > loc.capacity) throw new HttpError(409, `This storage location is full (${used}/${loc.capacity} used, ${items.length} item(s) to store)`);
      }
    }

    const results = [];
    for (const item of items) {
      if (rule.to) {
        await conn.query("UPDATE items SET status = ?, location_id = ?, updated_at = NOW() WHERE item_id = ?",
          [rule.to, rule.needsLocation ? locationId : item.location_id, item.item_id]);
        await conn.query(
          "INSERT INTO item_status_history (item_id, changed_by, old_status, new_status, remarks, changed_at) VALUES (?,?,?,?,?,NOW())",
          [item.item_id, req.user.id, item.status, rule.to, remarks]);
      }
      const [tx] = await conn.query(
        "INSERT INTO transactions (item_id, operator_id, action, verification_status, remarks, transaction_time) VALUES (?,?,?,?,?,NOW())",
        [item.item_id, req.user.id, action, verificationStatus, remarks]);
      results.push({ itemId: item.item_id, transactionId: tx.insertId, status: rule.to ?? item.status });
    }
    // the drop-off QR stops working once every item in it is cancelled
    if (rule.deactivateQr) {
      for (const d of new Set(items.map((i) => i.drop_off_id).filter(Boolean))) {
        const [[{ n }]] = await conn.query("SELECT COUNT(*) AS n FROM items WHERE drop_off_id = ? AND status <> ?", [d, STATUS.CANCELLED]);
        if (!n) await conn.query("UPDATE qr_codes SET is_active = 0 WHERE drop_off_id = ?", [d]);
      }
    }
    await conn.commit();

    const out = { action, verificationStatus, status: rule.to ?? (results.length === 1 ? results[0].status : null), results, skipped };
    if (results.length === 1) { out.itemId = results[0].itemId; out.transactionId = results[0].transactionId; }
    res.status(201).json(out);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// Activity log: who did what to which item, and when (newest first).
// Filters: operatorId, operatorName, action, itemId, dropOffId, hostelId, semesterId, locationId, from, to (dates, inclusive)
const TX_JOINS = `
    FROM transactions t
    JOIN items i ON i.item_id = t.item_id
    JOIN users ou ON ou.user_id = i.owner_id
    JOIN users op ON op.user_id = t.operator_id
    LEFT JOIN hostels h ON h.hostel_id = ou.hostel_id
    LEFT JOIN storage_locations l ON l.location_id = i.location_id
    LEFT JOIN drop_offs d ON d.drop_off_id = i.drop_off_id
    LEFT JOIN semesters s ON s.semester_id = d.semester_id`;

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = [];
  const params = [];
  const filters = {
    itemId: "t.item_id", operatorId: "t.operator_id", action: "t.action", dropOffId: "i.drop_off_id",
    hostelId: "ou.hostel_id", semesterId: "d.semester_id", locationId: "i.location_id",
  };
  for (const [key, col] of Object.entries(filters)) {
    if (req.query[key]) { where.push(`${col} = ?`); params.push(req.query[key]); }
  }
  if (req.query.operatorName) { where.push("op.full_name LIKE ?"); params.push(`%${req.query.operatorName}%`); }
  addDateRange(req.query, "t.transaction_time", where, params);
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${TX_JOINS} ${clause}`, params);
  const [data] = await db.query(
    `SELECT t.transaction_id AS id, t.item_id AS itemId, i.item_name AS itemName, i.drop_off_id AS dropOffId,
            i.status AS itemStatus, i.location_id AS locationId, l.location_name AS locationName,
            ou.full_name AS ownerName, ou.student_id AS ownerStudentId, h.hostel_name AS ownerHostel,
            s.semester_name AS semesterName,
            t.operator_id AS operatorId, op.full_name AS operatorName,
            t.action, t.verification_status AS verificationStatus, t.remarks, t.transaction_time AS transactionTime
     ${TX_JOINS}
       ${clause} ORDER BY t.transaction_time DESC, t.transaction_id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]);
  res.json({ data, page, limit, total });
});
