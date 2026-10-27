// Dates in requests are plain calendar days: 2026-07-01
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HttpError = require("./httpError");

// real calendar dates only (rejects 2026-02-30, 2026-13-01 ...)
function isDate(v) {
  if (typeof v !== "string" || !DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

// Adds "column >= from" and "column < to + 1 day" filters from ?from=&to= (both optional, `to` is inclusive).
function addDateRange(query, column, where, params) {
  for (const key of ["from", "to"]) {
    if (query[key] !== undefined && !isDate(query[key])) throw new HttpError(400, `${key} must be a date like 2026-07-01`);
  }
  if (query.from && query.to && query.to < query.from) throw new HttpError(400, "to must be on or after from");
  if (query.from) { where.push(`${column} >= ?`); params.push(query.from); }
  if (query.to) { where.push(`${column} < DATE_ADD(?, INTERVAL 1 DAY)`); params.push(query.to); }
}

module.exports = { isDate, addDateRange };
