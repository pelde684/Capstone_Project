const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const hostelController = require("../controllers/hostel.controller"); // <--- Import your hostel controller

// Your existing auth routes
router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authController.me);

// --- ADD THESE TWO LINES FOR THE DROPDOWNS ---
router.get("/hostels", hostelController.listHostels);
router.get("/hostels/:hostelId/rooms", hostelController.listRooms);

module.exports = router;