const express = require("express");
const authRoutes = require("./auth");
const incidentRoutes = require("./incidents");
const departmentRoutes = require("./departments");
const analyticsRoutes = require("./analytics");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/incidents", incidentRoutes);
router.use("/departments", departmentRoutes);
router.use("/analytics", analyticsRoutes);

module.exports = router;
