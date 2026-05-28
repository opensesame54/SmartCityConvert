import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import api from "../api/client";
import { AuthContext } from "../context/AuthContext";

const IncidentDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [incident, setIncident] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: "", note: "" });

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get(`/incidents/${id}`);
      setIncident(data.incident || data);
      setStatusForm((prev) => ({ ...prev, status: data.incident?.status || data.status }));
    };
    load();
  }, [id]);

  const submitStatus = async (event) => {
    event.preventDefault();
    await api.post(`/incidents/${id}/status`, statusForm);
  };

  if (!incident) {
    return (
      <div className="container-fluid px-4 page-wrap">
        <div className="card">
          <div className="card-body">Loading...</div>
        </div>
      </div>
    );
  }

  const incidentType = incident.incident_type || incident.incidentType;
  const priority = incident.priority;
  const updates = incident.status_updates || incident.statusUpdates || [];

  return (
    <div className="container-fluid px-4 page-wrap">
      <nav aria-label="breadcrumb" style={{ marginBottom: 20 }}>
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link to="/">Dashboard</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/my-incidents">Reports</Link>
          </li>
          <li className="breadcrumb-item active">{incident.tracking_id}</li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card mb-3">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, width: "100%" }}>
                <div>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      margin: "0 0 5px",
                      letterSpacing: "-0.3px",
                      color: "var(--text)",
                    }}
                  >
                    {incident.title}
                  </h2>
                  <code>{incident.tracking_id}</code>
                </div>
                <span className={`badge status-${incident.status?.toLowerCase()}`} style={{ fontSize: 12, padding: "5px 10px" }}>
                  {incident.status_display || incident.status}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-2 mb-4">
                <div className="col-6 col-md-3">
                  <div style={{ background: "var(--n-50)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-2)", fontWeight: 600, marginBottom: 4 }}>Type</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{incident.incident_type_display || incidentType}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div style={{ background: "var(--n-50)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-2)", fontWeight: 600, marginBottom: 4 }}>Priority</div>
                    <span className={`badge priority-${priority?.toLowerCase()}`}>
                      {incident.priority_display || priority}
                    </span>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div style={{ background: "var(--n-50)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-2)", fontWeight: 600, marginBottom: 4 }}>Department</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{incident.department?.name || "-"}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div style={{ background: "var(--n-50)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--text-2)", fontWeight: 600, marginBottom: 4 }}>Reporter</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{incident.reported_by?.username || "-"}</div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--text)", marginBottom: 16 }}>
                {incident.description}
              </p>

              {incident.address ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", marginBottom: 5 }}>
                  <i className="bi bi-geo-alt-fill" style={{ color: "var(--red)", fontSize: 12, flexShrink: 0 }}></i>
                  {incident.address}
                </div>
              ) : null}

              {incident.area ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", marginBottom: 5 }}>
                  <i className="bi bi-map" style={{ color: "var(--text-3)", fontSize: 12, flexShrink: 0 }}></i>
                  {incident.area}
                </div>
              ) : null}
            </div>
          </div>

          {incident.image_url ? (
            <div className="card mb-3">
              <div className="card-header">
                <i className="bi bi-image" style={{ color: "var(--text-2)" }}></i>Photo Evidence
              </div>
              <div className="card-body p-2">
                <img
                  src={incident.image_url}
                  className="img-fluid"
                  style={{ maxHeight: 320, width: "100%", objectFit: "cover", borderRadius: "var(--r-md)" }}
                  alt="Incident"
                />
              </div>
            </div>
          ) : null}

          {user && (user.role === "admin" || user.role === "worker") ? (
            <div className="card" style={{ borderColor: "#fde68a" }}>
              <div className="card-header" style={{ background: "var(--yellow-bg)", borderBottomColor: "#fde68a" }}>
                <i className="bi bi-pencil-square" style={{ color: "var(--yellow)" }}></i>Update Status
              </div>
              <div className="card-body">
                <form onSubmit={submitStatus} noValidate>
                  <div className="row g-2 align-items-end">
                    <div className="col-sm-4">
                      <label className="form-label">New Status</label>
                      <select
                        className="form-select"
                        value={statusForm.status}
                        onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        {[
                          "SUBMITTED",
                          "ASSIGNED",
                          "IN_PROGRESS",
                          "RESOLVED",
                          "ESCALATED",
                        ].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">Note (optional)</label>
                      <input
                        className="form-control"
                        value={statusForm.note}
                        onChange={(e) => setStatusForm((prev) => ({ ...prev, note: e.target.value }))}
                      />
                    </div>
                    <div className="col-sm-2">
                      <button type="submit" className="btn btn-warning w-100">
                        <i className="bi bi-check-lg"></i>Update
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </div>

        <div className="col-lg-5">
          <div className="card mb-3">
            <div className="card-header">
              <i className="bi bi-map" style={{ color: "var(--text-2)" }}></i>Location
            </div>
            <div className="card-body p-2">
              <div id="detail-map">
                {incident.latitude && incident.longitude ? (
                  <MapContainer
                    center={[incident.latitude, incident.longitude]}
                    zoom={15}
                    style={{ height: 250 }}
                  >
                    <TileLayer
                      attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={19}
                    />
                    <Marker position={[incident.latitude, incident.longitude]} />
                  </MapContainer>
                ) : (
                  <div className="empty-state" style={{ padding: 24 }}>
                    <div className="empty-title">No map data</div>
                    <div className="empty-body">This incident does not have location coordinates yet.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <i className="bi bi-clock-history" style={{ color: "var(--text-2)" }}></i>Status Timeline
            </div>
            <div className="card-body">
              <div className="sc-timeline">
                {updates.length ? (
                  updates.map((update, index) => (
                    <div className="sc-timeline-item" key={`${update.status}-${index}`}>
                      <span className={`badge status-${update.status?.toLowerCase()}`}>
                        {update.status_display || update.status}
                      </span>
                      {update.note ? (
                        <p style={{ fontSize: 13, color: "var(--text-2)", margin: "5px 0 3px", lineHeight: 1.55 }}>
                          {update.note}
                        </p>
                      ) : null}
                      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3 }}>
                        {update.timestamp ? new Date(update.timestamp).toLocaleString() : "-"}
                        {update.updated_by ? ` - ${update.updated_by.username}` : ""}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 13.5, color: "var(--text-2)", margin: 0 }}>No status updates yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
