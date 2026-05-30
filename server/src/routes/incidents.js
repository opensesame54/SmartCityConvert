const express = require("express");
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    return cb(null, true);
  },
});

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
