const mongoose = require("mongoose");

const statusUpdateSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    status: { type: String, required: true },
    note: { type: String },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

module.exports = mongoose.model("StatusUpdate", statusUpdateSchema);
