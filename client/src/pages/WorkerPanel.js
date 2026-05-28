import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

const WorkerPanel = () => {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/incidents", { params: { assigned: true } });
      const list = data.items || data.incidents || [];
      setIncidents(list.map((item) => ({ ...item, id: item.id || item._id })));
    };
    load();
  }, []);

  return (
    <div className="container-fluid px-4 page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Assigned Tasks</h1>
          <p className="page-subtitle">Incidents assigned to you for resolution</p>
        </div>
        {incidents.length ? (
          <span className="badge status-assigned" style={{ fontSize: 13, padding: "6px 12px" }}>
            {incidents.length} Active
          </span>
        ) : null}
      </div>

      {incidents.length ? (
        <div className="row g-3">
          {incidents.map((inc) => (
            <div className="col-sm-6 col-lg-4 col-xl-3" key={inc.id}>
              <div className={`task-card ${inc.is_overdue ? "overdue" : ""}`}>
                <div className="task-card-header">
                  <span className={`badge status-${inc.status?.toLowerCase()}`}>
                    {inc.status_display || inc.status}
                  </span>
                  <span className={`badge priority-${inc.priority?.toLowerCase()}`}>
                    {inc.priority_display || inc.priority}
                  </span>
                </div>
                <div className="task-card-body">
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: "var(--text)", margin: "10px 0 8px" }}>
                    {inc.title}
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--text-2)", margin: "0 0 12px", lineHeight: 1.55 }}>
                    {inc.description}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}>
                      <i className="bi bi-building" style={{ color: "var(--text-3)", fontSize: 11 }}></i>
                      {inc.department?.name || "No department"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}>
                      <i className="bi bi-geo-alt" style={{ color: "var(--text-3)", fontSize: 11 }}></i>
                      {inc.area || inc.address || "Location not set"}
                    </div>
                    {inc.deadline ? (
                      <div
                        style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
                        className={inc.is_overdue ? "text-danger fw-semibold" : "text-muted"}
                      >
                        <i className="bi bi-clock" style={{ fontSize: 11 }}></i>
                        Due {new Date(inc.deadline).toLocaleString()}
                        {inc.is_overdue ? <span className="badge status-escalated ms-1">Overdue</span> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="task-card-footer">
                  <Link to={`/incidents/${inc.id}`} className="btn btn-primary btn-sm w-100">
                    <i className="bi bi-arrow-right-circle"></i>View & Update
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-check-circle" style={{ color: "var(--green)" }}></i>
              </div>
              <div className="empty-title">All clear</div>
              <div className="empty-body">No incidents are currently assigned to you. Check back later.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerPanel;
