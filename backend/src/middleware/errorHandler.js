const multer = require("multer");

exports.notFound = (req, res) => res.status(404).json({ error: "Route not found" });

exports.errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE" ? "Photograph must be 5 MB or smaller" : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "A record with these details already exists" });
  if (err.code === "ER_NO_REFERENCED_ROW_2") return res.status(400).json({ error: "A referenced record does not exist" });

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? "Internal server error" : err.message });
};
