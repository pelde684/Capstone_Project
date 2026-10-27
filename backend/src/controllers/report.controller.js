const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { addDateRange } = require("../utils/dates");

// Admin: one row per operator - how many of each action they recorded, and when they were first/last active.
// Filters: from, to (dates, inclusive), operatorId. The detailed list is GET /transactions with the same filters.
exports.operatorActivity = asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.operatorId) { where.push("t.operator_id = ?"); params.push(req.query.operatorId); }
  addDateRange(req.query, "t.transaction_time", where, params);
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Note: "stored" is a reserved word in MySQL 8, so it is aliased as storedCount and renamed below.
  const [rows] = await db.query(
    `SELECT op.user_id AS operatorId, op.full_name AS operatorName,
            SUM(t.action = 'DEPOSIT') AS deposited,
            SUM(t.action = 'STORAGE_VERIFICATION') AS storedCount,
            SUM(t.action = 'COLLECTION_REQUEST') AS readyForCollection,
            SUM(t.action = 'COLLECTION') AS collected,
            SUM(t.action = 'REJECTION') AS rejected,
            SUM(t.action = 'CANCELLATION') AS cancelled,
            COUNT(*) AS total,
            MIN(t.transaction_time) AS firstActionAt, MAX(t.transaction_time) AS lastActionAt
       FROM transactions t JOIN users op ON op.user_id = t.operator_id
       ${clause}
      GROUP BY op.user_id, op.full_name
      ORDER BY total DESC, op.full_name`,
    params);

  // MySQL returns SUM() as text; send real numbers
  const data = rows.map(({ storedCount, ...r }) => ({
    ...r,
    deposited: Number(r.deposited),
    stored: Number(storedCount),
    readyForCollection: Number(r.readyForCollection),
    collected: Number(r.collected),
    rejected: Number(r.rejected),
    cancelled: Number(r.cancelled),
    total: Number(r.total),
  }));
  res.json({ from: req.query.from || null, to: req.query.to || null, data });
});
