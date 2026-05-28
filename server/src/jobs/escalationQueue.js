const Queue = require("bull");
const Incident = require("../models/Incident");
const StatusUpdate = require("../models/StatusUpdate");
const { getIo } = require("../socket");

const escalationQueue = new Queue(
  "escalation",
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

const startEscalationWorker = () => {
  escalationQueue.process(async () => {
    const now = new Date();
    const overdue = await Incident.find({
      deadline: { $lt: now },
      status: { $nin: ["RESOLVED", "ESCALATED"] },
    });

    if (!overdue.length) {
      return;
    }

    const io = getIo();

    for (const incident of overdue) {
      incident.status = "ESCALATED";
      incident.priority = "EMERGENCY";
      await incident.save();

      const statusUpdate = await StatusUpdate.create({
        incident: incident._id,
        status: incident.status,
        note: "Auto-escalated by system",
        updatedBy: null,
      });

      io.to("incidents_live").emit("incident.update", {
        incident_id: incident._id.toString(),
        tracking_id: incident.trackingId,
        title: incident.title,
        status: incident.status,
        status_display: incident.status,
        note: statusUpdate.note,
        updated_by: "System",
        timestamp: statusUpdate.timestamp,
      });
    }
  });

  escalationQueue.add(
    {},
    {
      jobId: "escalate-incidents",
      repeat: { every: 60 * 60 * 1000 },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
};

module.exports = { escalationQueue, startEscalationWorker };
