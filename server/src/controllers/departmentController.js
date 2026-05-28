const Department = require("../models/Department");

const DEFAULT_DEPARTMENTS = [
  {
    name: "Public Works",
    code: "PUBLIC_WORKS",
    email: "publicworks@municipal.gov",
    phone: "000-000-0000",
    description: "Roads, potholes, and infrastructure",
  },
  {
    name: "Sanitation",
    code: "SANITATION",
    email: "sanitation@municipal.gov",
    phone: "000-000-0000",
    description: "Garbage and waste management",
  },
  {
    name: "Electricity",
    code: "ELECTRICITY",
    email: "electricity@municipal.gov",
    phone: "000-000-0000",
    description: "Streetlights and power issues",
  },
  {
    name: "Water",
    code: "WATER",
    email: "water@municipal.gov",
    phone: "000-000-0000",
    description: "Leaks and water supply",
  },
  {
    name: "Traffic",
    code: "TRAFFIC",
    email: "traffic@municipal.gov",
    phone: "000-000-0000",
    description: "Signals and traffic management",
  },
  {
    name: "Miscellaneous",
    code: "MISC",
    email: "misc@municipal.gov",
    phone: "000-000-0000",
    description: "Uncategorized issues",
  },
];

const listDepartments = async (req, res) => {
  const departments = await Department.find().sort({ name: 1 }).lean();
  res.json({ items: departments.map((dept) => ({ id: dept._id.toString(), ...dept })) });
};

const seedDepartments = async (req, res) => {
  const results = [];
  for (const dept of DEFAULT_DEPARTMENTS) {
    const updated = await Department.findOneAndUpdate(
      { code: dept.code },
      { $set: dept },
      { upsert: true, new: true }
    );
    results.push(updated);
  }
  res.json({ items: results.map((dept) => ({ id: dept._id.toString(), ...dept.toObject() })) });
};

module.exports = {
  listDepartments,
  seedDepartments,
};
