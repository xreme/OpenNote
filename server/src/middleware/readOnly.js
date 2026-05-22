const { PREVIEW_MODE } = require("../config");

module.exports = function readOnly(req, res, next) {
  if (!PREVIEW_MODE) return next();
  if (req.method === "GET" || req.method === "HEAD") return next();
  res.status(403).json({ error: "This action is disabled in preview mode" });
};
