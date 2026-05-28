const { randomBytes } = require("crypto");

const DEPT_ROUTING = {
  POTHOLE: "PUBLIC_WORKS",
  GARBAGE: "SANITATION",
  STREETLIGHT: "ELECTRICITY",
  WATER_LEAK: "WATER",
  TRAFFIC: "TRAFFIC",
  MISC: "MISC",
};

const DEADLINE_HOURS = {
  EMERGENCY: 2,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

const generateTrackingId = () => {
  return `INC-${randomBytes(4).toString("hex").toUpperCase()}`;
};

const computeDeadline = (priority, fromDate = new Date()) => {
  const hours = DEADLINE_HOURS[priority] || DEADLINE_HOURS.MEDIUM;
  return new Date(fromDate.getTime() + hours * 60 * 60 * 1000);
};

const routeDepartmentCode = (incidentType) => {
  return DEPT_ROUTING[incidentType] || DEPT_ROUTING.MISC;
};

module.exports = {
  generateTrackingId,
  computeDeadline,
  routeDepartmentCode,
};
