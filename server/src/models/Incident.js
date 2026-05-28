const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    trackingId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    incidentType: {
      type: String,
      enum: ["POTHOLE", "GARBAGE", "STREETLIGHT", "WATER_LEAK", "TRAFFIC", "MISC"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED"],
      default: "SUBMITTED",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "EMERGENCY"],
      default: "LOW",
    },
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    area: { type: String },
    imageUrl: { type: String },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    resolvedAt: { type: Date },
    deadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", incidentSchema);
