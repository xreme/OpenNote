const rateLimit = require("express-rate-limit");
const { PREVIEW_MODE } = require("../config");

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many uploads, please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: PREVIEW_MODE ? 60 * 60 * 1000 : 15 * 60 * 1000,
  max: 30,
  message: {
    error: PREVIEW_MODE
      ? "Preview mode: limited to 5 chat messages per hour. Please wait before trying again."
      : "Too many AI requests, please wait before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { uploadLimiter, aiLimiter };
