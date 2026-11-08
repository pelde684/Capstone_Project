const QRCode = require("qrcode");
const db = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { allowedActionsFor } = require("../utils/status");
const svc = require("../services/dropOffService");

const isStaff = (u) => u.role === "Operator" || u.role === "Admin";

async function loadAuthorized(req, includeCancelled = true) {
  const [d] = await svc.loadDropOffs("WHERE d.drop_off_id = ?", [req.params.id], includeCancelled);
  if (!d) throw new HttpError(404, "Drop-off not found");
  if (!isStaff(req.user) && d.ownerId !== req.user.id) throw new HttpError(403, "This drop-off belongs to another student");
  return d;
}
const withActions = (d) => ({ ...d, items: d.items.map((i) => ({ ...i, allowedActions: allowedActionsFor(i.status) })) });

// multipart: items = JSON list [{name, categoryId, quantity, description}], photo_0, photo_1 ... = files
exports.create = asyncHandler(async (req, res) => {
  const r = await svc.createDropOff(req.user, svc.parseItems(req), svc.photosByIndex(req));
  res.status(201).json({ id: r.dropOffId, qrValue: r.qrValue, itemIds: r.itemIds, status: "REGISTERED" });
});

exports.update = asyncHandler(async (req, res) => {
  await svc.updateDropOff(req.user, req.params.id, svc.parseItems(req), svc.photosByIndex(req));
  const [d] = await svc.loadDropOffs("WHERE d.drop_off_id = ?", [req.params.id]);
  res.json(withActions(d));
});

exports.cancel = asyncHandler(async (req, res) => {
  await svc.cancelDropOff(req.user, req.params.id);
  res.json({ message: "Drop-off cancelled" });
});

exports.listMine = asyncHandler(async (req, res) => {
  const data = await svc.loadDropOffs("WHERE d.owner_id = ?", [req.user.id], req.query.includeCancelled === "1");
  res.json({ data: data.filter((d) => d.items.length || req.query.includeCancelled === "1").map(withActions) });
});

exports.getOne = asyncHandler(async (req, res) => {
  res.json(withActions(await loadAuthorized(req, req.query.includeCancelled === "1")));
});

// JSON with a data-URL by default; ?format=png returns the raw image (for printing the label)
exports.getQr = asyncHandler(async (req, res) => {
  const d = await loadAuthorized(req);
  const [[qr]] = await db.query("SELECT qr_value FROM qr_codes WHERE drop_off_id = ? AND is_active = 1", [d.id]);
  if (!qr) throw new HttpError(404, "No active QR code for this drop-off");
  if (req.query.format === "png") return res.type("png").send(await QRCode.toBuffer(qr.qr_value, { width: 400, margin: 2 }));
  res.json({ dropOffId: d.id, qrValue: qr.qr_value, dataUrl: await QRCode.toDataURL(qr.qr_value, { width: 400, margin: 2 }) });
});
