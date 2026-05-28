const Incident = require("../models/Incident");

const STATUS_LABELS = [
  "SUBMITTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "ESCALATED",
];

const TYPE_LABELS = [
  "POTHOLE",
  "GARBAGE",
  "STREETLIGHT",
  "WATER_LEAK",
  "TRAFFIC",
  "MISC",
];

const getAnalytics = async (req, res) => {
  const total = await Incident.countDocuments();
  const resolved = await Incident.countDocuments({ status: "RESOLVED" });
  const escalated = await Incident.countDocuments({ status: "ESCALATED" });

  const typeAgg = await Incident.aggregate([
    { $group: { _id: "$incidentType", count: { $sum: 1 } } },
  ]);
  const statusAgg = await Incident.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const typeCounts = TYPE_LABELS.map((label) => {
    const found = typeAgg.find((row) => row._id === label);
    return found ? found.count : 0;
  });

  const statusCounts = STATUS_LABELS.map((label) => {
    const found = statusAgg.find((row) => row._id === label);
    return found ? found.count : 0;
  });

  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const trendAgg = await Incident.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const trendMap = trendAgg.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  const trendLabels = [];
  const trendCounts = [];
  for (let i = 0; i < 30; i += 1) {
    const day = new Date(since);
    day.setDate(since.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    trendLabels.push(key);
    trendCounts.push(trendMap[key] || 0);
  }

  const heatmapDocs = await Incident.find({
    latitude: { $ne: null },
    longitude: { $ne: null },
  })
    .select("latitude longitude")
    .lean();

  const heatmap = heatmapDocs
    .filter((doc) => Number.isFinite(doc.latitude) && Number.isFinite(doc.longitude))
    .map((doc) => [doc.latitude, doc.longitude]);

  res.json({
    total,
    resolved,
    escalated,
    type_labels: TYPE_LABELS,
    type_counts: typeCounts,
    status_labels: STATUS_LABELS,
    status_counts: statusCounts,
    trend_labels: trendLabels,
    trend_counts: trendCounts,
    heatmap,
  });
};

module.exports = { getAnalytics };
