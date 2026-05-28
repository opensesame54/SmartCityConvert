import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from "react-leaflet";
import L from "leaflet";
import api from "../api/client";

const STATUS_COLORS = {
  SUBMITTED: "#2563eb",
  ASSIGNED: "#ca8a04",
  IN_PROGRESS: "#c2410c",
  RESOLVED: "#16a34a",
  ESCALATED: "#7c3aed",
};

const TYPE_ICONS = {
  POTHOLE: "\uD83D\uDD73\uFE0F",
  GARBAGE: "\uD83D\uDDD1\uFE0F",
  STREETLIGHT: "\uD83D\uDCA1",
  WATER_LEAK: "\uD83D\uDCA7",
  TRAFFIC: "\uD83D\uDEA6",
  MISC: "\uD83D\uDCCB",
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ESCALATED", label: "Escalated" },
];

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "POTHOLE", label: "Pothole" },
  { value: "GARBAGE", label: "Garbage" },
  { value: "STREETLIGHT", label: "Streetlight" },
  { value: "WATER_LEAK", label: "Water Leak" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "MISC", label: "Misc" },
];

const coloredIcon = (color, emoji) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;">${emoji}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });

const Dashboard = () => {
  const [filters, setFilters] = useState({ status: "", type: "", q: "" });
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const mapRef = useRef(null);

  const stats = useMemo(() => {
    const total = incidents.length;
    const resolved = incidents.filter((i) => i.status === "RESOLVED").length;
    const pending = incidents.filter((i) => i.status !== "RESOLVED").length;
    return { total, resolved, pending };
  }, [incidents]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/incidents", { params: filters });
        const list = data.items || data.incidents || [];
        setIncidents(list.map((item) => ({ ...item, id: item.id || item._id })));
      } catch (error) {
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const handleUpdate = () => {
      setFilters((prev) => ({ ...prev }));
    };
    window.addEventListener("incident-update", handleUpdate);
    return () => window.removeEventListener("incident-update", handleUpdate);
  }, []);

  useEffect(() => {
    if (!mapRef.current || incidents.length === 0) return;
    if (incidents.length === 1) {
      const inc = incidents[0];
      mapRef.current.setView([inc.latitude, inc.longitude], 14);
      return;
    }

    const bounds = L.latLngBounds(
      incidents.map((i) => [i.latitude, i.longitude]).filter((p) => p[0] && p[1])
    );
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds.pad(0.25), { maxZoom: 14 });
    }
  }, [incidents]);

  const focusIncident = (inc) => {
    if (!mapRef.current || !inc.latitude || !inc.longitude) return;
    mapRef.current.flyTo([inc.latitude, inc.longitude], 16, { duration: 1 });
  };

  return (
    <div className="map-shell">
      <div className="map-sidebar">
        <div className="sidebar-filters">
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".5px",
              color: "var(--text-2)",
              marginBottom: 10,
            }}
          >
            Filter
          </div>
          <select
            id="filter-status"
            className="form-select form-select-sm mb-2"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            id="filter-type"
            className="form-select form-select-sm mb-2"
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            id="filter-q"
            className="form-control form-control-sm"
            placeholder="Search title, ID..."
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
          />
        </div>

        <div className="sidebar-stats">
          <div className="sidebar-stat">
            <div className="sidebar-stat-value" style={{ color: "var(--blue)" }}>
              {stats.total}
            </div>
            <div className="sidebar-stat-label">Total</div>
          </div>
          <div className="sidebar-stat">
            <div className="sidebar-stat-value" style={{ color: "var(--green)" }}>
              {stats.resolved}
            </div>
            <div className="sidebar-stat-label">Resolved</div>
          </div>
          <div className="sidebar-stat">
            <div className="sidebar-stat-value" style={{ color: "var(--orange)" }}>
              {stats.pending}
            </div>
            <div className="sidebar-stat-label">Pending</div>
          </div>
        </div>

        <div id="incident-list">
          {loading ? (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <div
                className="spinner-border spinner-border-sm text-primary"
                style={{ width: 18, height: 18 }}
              ></div>
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: "12px 0 0" }}>
                Loading...
              </p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-search"></i>
              </div>
              <div className="empty-title">No incidents found</div>
              <div className="empty-body">Try adjusting your search or filters.</div>
            </div>
          ) : (
            incidents.map((inc) => {
              const status = inc.status || inc.status_code;
              return (
              <div
                key={inc.id}
                className="inc-item"
                role="button"
                onClick={() => focusIncident(inc)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="inc-item-title">{inc.title}</div>
                    <div className="inc-item-meta">
                      {inc.tracking_id}
                      {inc.area ? ` - ${inc.area}` : ""}
                    </div>
                  </div>
                  <span className={`badge status-${status?.toLowerCase()}`}>
                    {inc.status_display || status}
                  </span>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>

      <div id="main-map">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          zoomControl={false}
          style={{ height: "100%" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          {incidents.map((inc) => {
            if (!inc.latitude || !inc.longitude) return null;
            const status = inc.status || inc.status_code;
            const incidentType = inc.incident_type || inc.incidentType;
            const color = STATUS_COLORS[status] || "#888";
            const emoji = TYPE_ICONS[incidentType] || "\uD83D\uDCCD";
            return (
              <Marker
                key={inc.id}
                position={[inc.latitude, inc.longitude]}
                icon={coloredIcon(color, emoji)}
              >
                <Popup>
                  <div style={{ fontFamily: "Inter, sans-serif", minWidth: 190, padding: "2px 0" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0f172a",
                        marginBottom: 8,
                        lineHeight: 1.35,
                      }}
                    >
                      {inc.title}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 3,
                          background: `${color}20`,
                          color: color,
                        }}
                      >
                        {inc.status_display || status}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 3,
                          background: "#f1f5f9",
                          color: "#475569",
                        }}
                      >
                        {inc.priority_display || inc.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 3 }}>
                      {inc.incident_type_display || incidentType} - {inc.department?.name || inc.department}
                    </div>
                    {inc.address ? (
                      <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 8 }}>
                        {inc.address}
                      </div>
                    ) : null}
                    <a
                      href={`/incidents/${inc.id}`}
                      style={{ fontSize: 12.5, color: "#2563eb", fontWeight: 500, textDecoration: "none" }}
                    >
                      View details -&gt;
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default Dashboard;
