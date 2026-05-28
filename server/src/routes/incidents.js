const express = require("express");
const path = require("path");
const multer = require("multer");
const {
  listIncidents,
  createIncident,
  getIncident,
  updateIncidentStatus,
} = require("../controllers/incidentController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

router.get("/", listIncidents);
router.post("/", requireAuth, requireRole("citizen"), upload.single("image"), createIncident);
router.get("/:id", requireAuth, getIncident);
router.post(
  "/:id/status",
  requireAuth,
  requireRole("admin", "worker"),
  updateIncidentStatus
);

module.exports = router;
