const Incident = require("../models/Incident");
const StatusUpdate = require("../models/StatusUpdate");
const Department = require("../models/Department");
const User = require("../models/User");
const {
  computeDeadline,
  generateTrackingId,
  routeDepartmentCode,
} = require("../services/incidentService");
const { getIo } = require("../socket");

const STATUS_LABELS = {
  SUBMITTED: "Submitted",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated",
};

const TYPE_LABELS = {
  POTHOLE: "Pothole",
  GARBAGE: "Garbage",
  STREETLIGHT: "Streetlight",
  WATER_LEAK: "Water Leak",
  TRAFFIC: "Traffic",
  MISC: "Misc",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  EMERGENCY: "Emergency",
};

const priorityRank = (priority) => {
  if (priority === "EMERGENCY") return 0;
  if (priority === "HIGH") return 1;
  if (priority === "MEDIUM") return 2;
  return 3;
};

const formatIncident = (incident) => {
  const now = new Date();
  const isOverdue = incident.deadline ? new Date(incident.deadline) < now : false;

  return {
    id: incident._id.toString(),
    tracking_id: incident.trackingId,
    title: incident.title,
    description: incident.description,
    incident_type: incident.incidentType,
    incident_type_display: TYPE_LABELS[incident.incidentType] || incident.incidentType,
    status: incident.status,
    status_display: STATUS_LABELS[incident.status] || incident.status,
    priority: incident.priority,
    priority_display: PRIORITY_LABELS[incident.priority] || incident.priority,
    latitude: incident.latitude,
    longitude: incident.longitude,
    address: incident.address,
    area: incident.area,
    image_url: incident.imageUrl || null,
    department: incident.department
      ? {
          id: incident.department._id?.toString() || incident.department.toString(),
          name: incident.department.name,
          code: incident.department.code,
        }
      : null,
    reported_by: incident.reportedBy
      ? {
          id: incident.reportedBy._id?.toString() || incident.reportedBy.toString(),
          username: incident.reportedBy.username,
        }
      : null,
    assigned_to: incident.assignedTo
      ? {
          id: incident.assignedTo._id?.toString() || incident.assignedTo.toString(),
          username: incident.assignedTo.username,
        }
      : null,
    created_at: incident.createdAt,
    updated_at: incident.updatedAt,
    resolved_at: incident.resolvedAt,
    deadline: incident.deadline,
    is_overdue: isOverdue,
  };
};

const formatStatusUpdate = (update) => ({
  status: update.status,
  status_display: STATUS_LABELS[update.status] || update.status,
  note: update.note,
  updated_by: update.updatedBy
    ? {
        id: update.updatedBy._id?.toString() || update.updatedBy.toString(),
        username: update.updatedBy.username,
      }
    : null,
  timestamp: update.timestamp,
});

const listIncidents = async (req, res) => {
  const { status, type, area, q, mine, assigned, scope } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (type) filter.incidentType = type;
  if (area) filter.area = { $regex: area, $options: "i" };
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { trackingId: { $regex: q, $options: "i" } },
      { area: { $regex: q, $options: "i" } },
    ];
  }

  if (mine && req.user?.id) {
    filter.reportedBy = req.user.id;
  }

  if (assigned && req.user?.id) {
    filter.assignedTo = req.user.id;
  }

  if (scope !== "all" && req.user?.role === "citizen") {
    filter.reportedBy = req.user.id;
  }

  const incidents = await Incident.find(filter)
    .populate("department", "name code")
    .populate("reportedBy", "username")
    .populate("assignedTo", "username")
    .lean();

  incidents.sort((a, b) => {
    const rankA = priorityRank(a.priority);
    const rankB = priorityRank(b.priority);
    if (rankA !== rankB) return rankA - rankB;
    const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    if (deadlineA !== deadlineB) return deadlineA - deadlineB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json({ items: incidents.map(formatIncident) });
};

const createIncident = async (req, res) => {
  const {
    incident_type,
    priority,
    title,
    description,
    latitude,
    longitude,
    address,
    area,
  } = req.body;

  if (!incident_type || !priority || !title) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const trackingId = generateTrackingId();
  const deadline = computeDeadline(priority);
  const departmentCode = routeDepartmentCode(incident_type);
  const department = await Department.findOne({ code: departmentCode });

  let assignedTo = null;
  if (priority === "EMERGENCY" && department) {
    assignedTo = await User.findOne({ role: "worker", department: department._id });
  }

  const initialStatus = assignedTo ? "ASSIGNED" : "SUBMITTED";
  const lat = latitude !== undefined ? Number(latitude) : undefined;
  const lng = longitude !== undefined ? Number(longitude) : undefined;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const incident = await Incident.create({
    trackingId,
    title,
    description,
    incidentType: incident_type,
    status: initialStatus,
    priority,
    latitude: Number.isFinite(lat) ? lat : undefined,
    longitude: Number.isFinite(lng) ? lng : undefined,
    address,
    area,
    imageUrl,
    reportedBy: req.user.id,
    assignedTo: assignedTo?._id || null,
    department: department?._id || null,
    deadline,
  });

  const statusUpdate = await StatusUpdate.create({
    incident: incident._id,
    status: incident.status,
    note: assignedTo ? "Incident assigned" : "Incident submitted",
    updatedBy: req.user.id,
  });

  const populated = await Incident.findById(incident._id)
    .populate("department", "name code")
    .populate("reportedBy", "username")
    .populate("assignedTo", "username")
    .lean();

  const io = getIo();
  io.to("incidents_live").emit("incident.update", {
    incident_id: incident._id.toString(),
    tracking_id: incident.trackingId,
    title: incident.title,
    status: incident.status,
    status_display: STATUS_LABELS[incident.status] || incident.status,
    note: statusUpdate.note,
    updated_by: req.user?.username || "System",
    timestamp: statusUpdate.timestamp,
  });

  res.status(201).json({ incident: formatIncident(populated) });
};

const getIncident = async (req, res) => {
  const { id } = req.params;
  const incident = await Incident.findById(id)
    .populate("department", "name code")
    .populate("reportedBy", "username")
    .populate("assignedTo", "username")
    .lean();

  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }

  if (req.user?.role === "citizen" && incident.reportedBy?._id?.toString() !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updates = await StatusUpdate.find({ incident: incident._id })
    .populate("updatedBy", "username")
    .sort({ timestamp: 1 })
    .lean();

  res.json({
    incident: {
      ...formatIncident(incident),
      status_updates: updates.map(formatStatusUpdate),
    },
  });
};

const updateIncidentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note, department } = req.body;

  const incident = await Incident.findById(id).populate("assignedTo", "username");
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }

  if (req.user?.role === "worker") {
    if (!incident.assignedTo || incident.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  if (department) {
    incident.department = department;
  }

  if (status) {
    incident.status = status;
    if (status === "RESOLVED") {
      incident.resolvedAt = new Date();
    }
    if (status === "ESCALATED") {
      incident.priority = "EMERGENCY";
      incident.deadline = computeDeadline("EMERGENCY");
    }
  }

  await incident.save();

  const statusUpdate = await StatusUpdate.create({
    incident: incident._id,
    status: incident.status,
    note: note || "Status updated",
    updatedBy: req.user?.id || null,
  });

  const io = getIo();
  io.to("incidents_live").emit("incident.update", {
    incident_id: incident._id.toString(),
    tracking_id: incident.trackingId,
    title: incident.title,
    status: incident.status,
    status_display: STATUS_LABELS[incident.status] || incident.status,
    note: statusUpdate.note,
    updated_by: req.user?.username || "System",
    timestamp: statusUpdate.timestamp,
  });

  res.json({ status: "ok" });
};

module.exports = {
  listIncidents,
  createIncident,
  getIncident,
  updateIncidentStatus,
};
