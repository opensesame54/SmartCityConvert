require("dotenv").config();

const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const { connectDb } = require("../config/db");
const Department = require("../models/Department");
const User = require("../models/User");
const Incident = require("../models/Incident");
const StatusUpdate = require("../models/StatusUpdate");

const getPgClient = () => {
  const connectionString = process.env.PG_URI;
  return new Client(
    connectionString
      ? { connectionString, ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined }
      : {
          host: process.env.PG_HOST || "localhost",
          port: Number(process.env.PG_PORT || 5432),
          user: process.env.PG_USER,
          password: process.env.PG_PASSWORD,
          database: process.env.PG_NAME,
          ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : undefined,
        }
  );
};

const migrate = async () => {
  await connectDb(process.env.MONGO_URI);
  const pg = getPgClient();
  await pg.connect();

  const deptRows = await pg.query(
    "SELECT id, name, code, email, phone, description FROM incidents_department"
  );

  const deptMap = new Map();
  for (const row of deptRows.rows) {
    const doc = await Department.findOneAndUpdate(
      { code: row.code },
      {
        $set: {
          name: row.name,
          code: row.code,
          email: row.email,
          phone: row.phone,
          description: row.description,
        },
      },
      { upsert: true, new: true }
    );
    deptMap.set(row.id, doc._id);
  }

  const userRows = await pg.query(
    "SELECT id, username, email, role, phone, department_id, is_active FROM accounts_user"
  );

  const userMap = new Map();
  const defaultPasswordHash = await bcrypt.hash("ChangeMe123!", 10);
  for (const row of userRows.rows) {
    const doc = await User.findOneAndUpdate(
      { email: row.email },
      {
        $set: {
          username: row.username,
          email: row.email,
          role: row.role || "citizen",
          phone: row.phone,
          department: row.department_id ? deptMap.get(row.department_id) : null,
          isActive: row.is_active,
          passwordHash: defaultPasswordHash,
        },
      },
      { upsert: true, new: true }
    );
    userMap.set(row.id, doc._id);
  }

  const incidentRows = await pg.query(
    "SELECT id, tracking_id, title, description, incident_type, status, priority, latitude, longitude, address, area, reported_by_id, assigned_to_id, department_id, created_at, updated_at, resolved_at, deadline FROM incidents_incident"
  );

  const incidentMap = new Map();
  for (const row of incidentRows.rows) {
    const doc = await Incident.create({
      trackingId: row.tracking_id,
      title: row.title,
      description: row.description,
      incidentType: row.incident_type,
      status: row.status,
      priority: row.priority,
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
      area: row.area,
      reportedBy: row.reported_by_id ? userMap.get(row.reported_by_id) : null,
      assignedTo: row.assigned_to_id ? userMap.get(row.assigned_to_id) : null,
      department: row.department_id ? deptMap.get(row.department_id) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at,
      deadline: row.deadline,
    });
    incidentMap.set(row.id, doc._id);
  }

  const updateRows = await pg.query(
    "SELECT incident_id, status, note, updated_by_id, timestamp FROM incidents_statusupdate"
  );

  for (const row of updateRows.rows) {
    await StatusUpdate.create({
      incident: incidentMap.get(row.incident_id),
      status: row.status,
      note: row.note,
      updatedBy: row.updated_by_id ? userMap.get(row.updated_by_id) : null,
      timestamp: row.timestamp,
    });
  }

  console.log("Migration complete.");
  console.log("All migrated users share password: ChangeMe123! Please reset.");

  await pg.end();
};

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
