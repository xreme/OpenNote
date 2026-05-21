const SITE_PASSWORD = process.env.SITE_PASSWORD;

module.exports = function requirePassword(req, res, next) {
  if (!SITE_PASSWORD) return next();
  if (req.headers["x-app-password"] === SITE_PASSWORD) return next();
  res.status(401).json({ error: "Unauthorized" });
};
