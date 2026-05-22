const { PREVIEW_MODE } = require("../config");

function readOnly(message) {
  return function (req, res, next) {
    if (!PREVIEW_MODE) return next();
    if (req.method === "GET" || req.method === "HEAD") return next();
    res.status(403).json({
      error: message || "This action is disabled in preview mode",
      previewMode: true,
    });
  };
}

module.exports = readOnly;
