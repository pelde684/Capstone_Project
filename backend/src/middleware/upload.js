const multer = require("multer");
const HttpError = require("../utils/httpError");

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Keep the file in memory and stream it straight to Cloudinary.
// files: up to 20 items x 4 photos each in one drop-off.
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 80 },
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype)
      ? cb(null, true)
      : cb(new HttpError(400, "Only JPEG, PNG or WebP images are allowed")),
});
