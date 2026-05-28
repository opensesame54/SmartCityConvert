const express = require("express");
const {
  listDepartments,
  seedDepartments,
} = require("../controllers/departmentController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

router.get("/", listDepartments);
router.post("/seed", requireAuth, requireRole("admin"), seedDepartments);

module.exports = router;
