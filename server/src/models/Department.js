const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
