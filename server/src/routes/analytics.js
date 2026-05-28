const express = require("express");
const { getAnalytics } = require("../controllers/analyticsController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

router.get("/", requireAuth, requireRole("admin", "worker"), getAnalytics);

module.exports = router;
