const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const HttpError = require("../utils/httpError");
const { authenticate, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const auth = require("../controllers/auth.controller");
const users = require("../controllers/user.controller");
const items = require("../controllers/item.controller");
const scan = require("../controllers/scan.controller");
const tx = require("../controllers/transaction.controller");
const lookup = require("../controllers/lookup.controller");
const dropOffs = require("../controllers/dropoff.controller");
const reports = require("../controllers/report.controller");
const shiftReports = require("../controllers/shiftReport.controller");

const staff = authorize("Operator", "Admin");
const admin = authorize("Admin");
const student = authorize("Student");

router.param("id", (req, res, next, v) =>
  /^\d+$/.test(v) ? next() : next(new HttpError(400, "Invalid id")));

// ---- Public ----
router.post("/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, message: { error: "Too many login attempts, try again later" } }), auth.login);

// ---- Everything below needs a valid token ----
router.use(authenticate);

router.get("/auth/me", auth.me);
router.post("/auth/change-password", auth.changePassword);

// Users (Admin)
router.get("/users", admin, users.list);
router.post("/users", admin, users.create);
router.put("/users/:id", admin, users.update);
router.patch("/users/:id/status", admin, users.setStatus);
router.post("/users/:id/reset-password", admin, users.resetPassword);

// Categories & storage locations (read: everyone, write: Admin)
router.get("/categories", lookup.listCategories);
router.post("/categories", admin, lookup.createCategory);
router.put("/categories/:id", admin, lookup.updateCategory);
router.get("/locations", lookup.listLocations);
router.post("/locations", admin, lookup.createLocation);
router.put("/locations/:id", admin, lookup.updateLocation);

// Hostels & semesters (read: everyone, write: Admin)
router.get("/hostels", lookup.listHostels);
router.post("/hostels", admin, lookup.createHostel);
router.put("/hostels/:id", admin, lookup.updateHostel);
router.get("/semesters", lookup.listSemesters);
router.post("/semesters", admin, lookup.createSemester);
router.put("/semesters/:id", admin, lookup.updateSemester);

// Items
router.post("/items", student, upload.single("photo"), items.create);
router.get("/items/mine", student, items.listMine);
router.get("/items", staff, items.listAll);
router.get("/items/:id", items.getOne);
router.get("/items/:id/qr", items.getQr);
router.post("/items/:id/cancel", authorize("Student", "Admin"), items.cancel);

// Drop-offs: one QR shared by several items (multipart: items = JSON list, photo_0, photo_1 ... files)
router.post("/drop-offs", student, upload.any(), dropOffs.create);
router.get("/drop-offs/mine", student, dropOffs.listMine);
router.get("/drop-offs/:id", dropOffs.getOne);
router.get("/drop-offs/:id/qr", dropOffs.getQr);
router.put("/drop-offs/:id", authorize("Student", "Admin"), upload.any(), dropOffs.update);
router.post("/drop-offs/:id/cancel", authorize("Student", "Admin"), dropOffs.cancel);

// Operator workflow
router.post("/scan", staff, scan.scan);
router.post("/transactions", staff, tx.create);
router.get("/transactions", staff, tx.list);
router.get("/stats", staff, lookup.stats);

// Shift reports: operators submit their own, operators and admins can read them
router.post("/shift-reports", authorize("Operator"), shiftReports.submit);
router.get("/shift-reports", staff, shiftReports.list);

// Reports (Admin)
router.get("/reports/operator-activity", admin, reports.operatorActivity);

module.exports = router;
