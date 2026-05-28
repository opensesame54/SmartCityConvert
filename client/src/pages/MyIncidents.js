import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

const MyIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/incidents", { params: { mine: true } });
        const list = data.items || data.incidents || [];
        setIncidents(list.map((item) => ({ ...item, id: item.id || item._id })));
      } catch (error) {
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container-fluid px-4 page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Reports</h1>
          <p className="page-subtitle">All incidents you've submitted</p>
        </div>
        <Link to="/report" className="btn btn-primary">
          <i className="bi bi-plus-lg"></i>New Report
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="card-body">Loading...</div>
        ) : incidents.length ? (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>
                      <code>{inc.tracking_id}</code>
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: 240 }}>{inc.title}</td>
                    <td style={{ fontSize: 13, color: "var(--text-2)" }}>
                      {inc.incident_type_display || inc.incident_type}
                    </td>
                    <td>
                      <span className={`badge priority-${inc.priority?.toLowerCase()}`}>
                        {inc.priority_display || inc.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge status-${inc.status?.toLowerCase()}`}>
                        {inc.status_display || inc.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-2)" }}>
                      {inc.created_at ? new Date(inc.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td>
                      <Link to={`/incidents/${inc.id}`} className="btn btn-outline-primary btn-sm">
                        <i className="bi bi-arrow-right"></i>View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-body p-0">
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-clipboard"></i>
              </div>
              <div className="empty-title">No reports yet</div>
              <div className="empty-body">
                You haven't submitted any incidents. Help improve your city by reporting issues you find.
              </div>
              <Link to="/report" className="btn btn-primary">
                <i className="bi bi-plus-lg"></i>Report an Issue
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyIncidents;
