const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/pagination");
const SHIFTS = require("../utils/shifts");
const { isDate, addDateRange } = require("../utils/dates");

const SELECT = `
  SELECT r.shift_report_id AS id, r.operator_id AS operatorId, u.full_name AS operatorName,
         DATE_FORMAT(r.shift_date, '%Y-%m-%d') AS date, r.shift,
         r.deposited, r.stored_count AS storedCount, r.handed_back AS handedBack, r.rejected, r.total_actions AS totalActions,
         r.items_in_storage AS itemsInStorage, r.items_waiting AS itemsWaiting,
         r.notes, r.submitted_at AS submittedAt, r.updated_at AS updatedAt
    FROM shift_reports r JOIN users u ON u.user_id = r.operator_id`;
// "stored" is a reserved word in MySQL 8, so the column is stored_count; the API still calls it "stored"
const withLabel = ({ storedCount, ...r }) => ({ ...r, stored: storedCount, shiftLabel: SHIFTS[r.shift]?.label || r.shift });

// Operator submits (or re-submits) the report for one of their own shifts.
// Body: { date: "2026-10-27", shift: "MORNING" | "AFTERNOON" | "WHOLE_DAY", notes }
exports.submit = asyncHandler(async (req, res) => {
  const { date, shift, notes = null } = req.body || {};
  if (!isDate(date)) throw new HttpError(400, "date must be a date like 2026-10-27");
  if (!Object.hasOwn(SHIFTS, shift)) throw new HttpError(400, `shift must be one of: ${Object.keys(SHIFTS).join(", ")}`);
  if (notes !== null && (typeof notes !== "string" || notes.length > 2000)) throw new HttpError(400, "notes must be text of at most 2000 characters");
  const [[{ future }]] = await db.query("SELECT ? > CURDATE() AS future", [date]);
  if (future) throw new HttpError(400, "You cannot submit a report for a future date");

  // Count this operator's actions in that shift from the transactions table (not from the browser)
  const { from, to } = SHIFTS[shift];
  const [[c]] = await db.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(action = 'DEPOSIT'), 0) AS deposited,
            COALESCE(SUM(action = 'STORAGE_VERIFICATION'), 0) AS storedCount,
            COALESCE(SUM(action = 'COLLECTION'), 0) AS handedBack,
            COALESCE(SUM(action = 'REJECTION'), 0) AS rejected
       FROM transactions
      WHERE operator_id = ? AND DATE(transaction_time) = ? AND HOUR(transaction_time) >= ? AND HOUR(transaction_time) < ?`,
    [req.user.id, date, from, to]);
  const [[room]] = await db.query(
    `SELECT COALESCE(SUM(status IN ('STORED','READY_FOR_COLLECTION')), 0) AS inStorage,
            COALESCE(SUM(status IN ('REGISTERED','DEPOSITED')), 0) AS waiting
       FROM items`);

  const text = notes?.trim() || null;
  await db.query(
    `INSERT INTO shift_reports (operator_id, shift_date, shift, deposited, stored_count, handed_back, rejected,
                                total_actions, items_in_storage, items_waiting, notes, submitted_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())
     ON DUPLICATE KEY UPDATE deposited = VALUES(deposited), stored_count = VALUES(stored_count), handed_back = VALUES(handed_back),
       rejected = VALUES(rejected), total_actions = VALUES(total_actions), items_in_storage = VALUES(items_in_storage),
       items_waiting = VALUES(items_waiting), notes = VALUES(notes), updated_at = NOW()`,
    [req.user.id, date, shift, Number(c.deposited), Number(c.storedCount), Number(c.handedBack), Number(c.rejected),
     Number(c.total), Number(room.inStorage), Number(room.waiting), text]);

  const [[row]] = await db.query(`${SELECT} WHERE r.operator_id = ? AND r.shift_date = ? AND r.shift = ?`, [req.user.id, date, shift]);
  res.status(201).json(withLabel(row));
});

// Operators and admins can read submitted reports (the next operator sees the previous one's notes).
// Filters: operatorId, shift, from, to (dates, inclusive)
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const where = [];
  const params = [];
  if (req.query.operatorId) { where.push("r.operator_id = ?"); params.push(req.query.operatorId); }
  if (req.query.shift) { where.push("r.shift = ?"); params.push(req.query.shift); }
  addDateRange(req.query, "r.shift_date", where, params);
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM shift_reports r ${clause}`, params);
  const [rows] = await db.query(`${SELECT} ${clause} ORDER BY r.shift_date DESC, r.submitted_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ data: rows.map(withLabel), page, limit, total });
});
