const QRCode = require("qrcode");
const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

// QR labels for printing (meeting 9: six QR codes on one A4 sheet).
// One drop-off has one QR, but every bag needs its own label, so this returns ONE LABEL PER ITEM:
// the drop-off's QR image + short code + item name + owner. The frontend lays them out 6 per page.
//
// GET /api/qr-labels?dropOffIds=9,10
//   - students: only their own drop-offs; leave dropOffIds out to get all their items still in the system
//   - operators/admins: dropOffIds is required
// Items that are cancelled or already collected get no label, and neither do inactive QR codes.

const MAX_DROP_OFFS = 30;
const LABEL_STATUSES = ["REGISTERED", "DEPOSITED", "STORED", "READY_FOR_COLLECTION"];
const isStaff = (u) => u.role === "Operator" || u.role === "Admin";

function parseIds(raw) {
  if (raw === undefined || raw === "") return null;
  const ids = [...new Set(String(raw).split(",").map((s) => s.trim()).filter(Boolean).map(Number))];
  if (!ids.length || ids.length > MAX_DROP_OFFS || ids.some((n) => !Number.isInteger(n) || n < 1))
    throw new HttpError(400, `dropOffIds must be a comma-separated list of 1 to ${MAX_DROP_OFFS} drop-off ids, e.g. 9,10`);
  return ids;
}

exports.labels = asyncHandler(async (req, res) => {
  const ids = parseIds(req.query.dropOffIds);
  if (!ids && isStaff(req.user)) throw new HttpError(400, "dropOffIds is required, e.g. ?dropOffIds=9,10");

  const where = ["q.is_active = 1", "i.status IN (?)"];
  const params = [LABEL_STATUSES];
  if (ids) { where.push("d.drop_off_id IN (?)"); params.push(ids); }
  if (!isStaff(req.user)) { where.push("d.owner_id = ?"); params.push(req.user.id); }

  // A student asking for someone else's drop-off simply gets no labels for it; say so clearly
  if (ids && !isStaff(req.user)) {
    const [owned] = await db.query("SELECT drop_off_id FROM drop_offs WHERE drop_off_id IN (?) AND owner_id = ?", [ids, req.user.id]);
    if (owned.length !== ids.length) throw new HttpError(403, "You can only print labels for your own drop-offs");
  }

  const [rows] = await db.query(
    `SELECT d.drop_off_id AS dropOffId, q.qr_value AS qrValue,
            i.item_id AS itemId, i.item_name AS itemName, c.category_name AS categoryName, i.status,
            u.full_name AS ownerName, u.student_id AS ownerStudentId
       FROM drop_offs d
       JOIN qr_codes q ON q.drop_off_id = d.drop_off_id
       JOIN items i ON i.drop_off_id = d.drop_off_id
       JOIN categories c ON c.category_id = i.category_id
       JOIN users u ON u.user_id = d.owner_id
      WHERE ${where.join(" AND ")}
      ORDER BY d.created_at DESC, d.drop_off_id DESC, i.item_id`,
    params);

  // Same QR for every item of a drop-off: draw each one only once
  const images = {};
  for (const r of rows) {
    images[r.qrValue] ||= await QRCode.toDataURL(r.qrValue, { width: 300, margin: 1, errorCorrectionLevel: "M" });
  }

  const counts = {};
  for (const r of rows) counts[r.dropOffId] = (counts[r.dropOffId] || 0) + 1;
  const seen = {};
  const labels = rows.map((r) => {
    seen[r.dropOffId] = (seen[r.dropOffId] || 0) + 1;
    return {
      dropOffId: r.dropOffId,
      itemId: r.itemId,
      itemName: r.itemName,
      categoryName: r.categoryName,
      status: r.status,
      ownerName: r.ownerName,
      ownerStudentId: r.ownerStudentId,
      shortCode: r.qrValue.slice(0, 8).toUpperCase(),
      qrValue: r.qrValue,
      qrImage: images[r.qrValue], // data:image/png;base64,... - can go straight into <img src>
      bagNumber: `${seen[r.dropOffId]} of ${counts[r.dropOffId]}`, // e.g. "2 of 3" bags in this drop-off
    };
  });

  res.json({ count: labels.length, perPage: 6, pages: Math.ceil(labels.length / 6), labels });
});
