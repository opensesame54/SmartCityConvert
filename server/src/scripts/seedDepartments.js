require("dotenv").config();

const { connectDb } = require("../config/db");
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

const seedDepartments = async () => {
  await connectDb(process.env.MONGO_URI);

  for (const dept of DEFAULT_DEPARTMENTS) {
    await Department.findOneAndUpdate({ code: dept.code }, { $set: dept }, { upsert: true });
  }

  const count = await Department.countDocuments();
  console.log(`Departments seeded. Total: ${count}`);
};

seedDepartments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  });
