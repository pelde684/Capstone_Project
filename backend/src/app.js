const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Behind a hosting proxy (Render, Railway, ...) set TRUST_PROXY=1 so the login rate limit sees each user's real address
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);

// CSP allows Cloudinary photos (res.cloudinary.com) and data: URLs (QR images)
app.use(helmet({
  contentSecurityPolicy: { directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(), "img-src": ["'self'", "data:", "https://res.cloudinary.com"] } },
}));
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",") }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use(express.static(path.join(__dirname, "..", "public"))); // test console at http://localhost:5000/
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
