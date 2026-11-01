const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { allowedActionsFor } = require("../utils/status");
const { loadDropOffs } = require("../services/dropOffService");

// Short code = first 8 hex characters of the QR value (shown under the QR, e.g. 8D40E85C).
const SHORT_CODE = /^[0-9a-f]{8}$/i;

// Find the drop-off for a full QR value, or for a short code typed by an operator.
async function findDropOffId(input) {
  const [[exact]] = await db.query("SELECT drop_off_id FROM qr_codes WHERE qr_value = ?", [input]);
  if (exact) return exact.drop_off_id;

  if (!SHORT_CODE.test(input)) return null;

  const [matches] = await db.query(
    "SELECT drop_off_id FROM qr_codes WHERE qr_value LIKE ? AND is_active = 1 LIMIT 2",
    [`${input.toLowerCase()}%`]
  );
  if (matches.length > 1) {
    throw new HttpError(409, "Short code matches more than one drop-off, scan the full QR instead");
  }
  return matches[0]?.drop_off_id ?? null;
}

// Operator scans a drop-off QR -> owner + every (non-cancelled) item with photo, status and allowed actions.
// `allowedActions` (top level) = actions at least one item can take, for "apply to all" buttons.
exports.scan = asyncHandler(async (req, res) => {
  const qrValue = typeof req.body?.qrValue === "string" ? req.body.qrValue.trim() : "";
  if (!qrValue) throw new HttpError(400, "qrValue is required");

  const dropOffId = await findDropOffId(qrValue);
  if (!dropOffId) throw new HttpError(404, "QR code not recognised");

  const [d] = await loadDropOffs("WHERE d.drop_off_id = ?", [dropOffId]);
  const items = d.items.map((i) => ({ ...i, allowedActions: allowedActionsFor(i.status) }));
  const { items: _omit, ...dropOff } = d;
  res.json({ dropOff, items, allowedActions: [...new Set(items.flatMap((i) => i.allowedActions))] });
});
