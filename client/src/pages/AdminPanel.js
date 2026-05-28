import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import api from "../api/client";

const statusOptions = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ESCALATED", label: "Escalated" },
];

const statusColors = {
  SUBMITTED: "#2563eb",
  ASSIGNED: "#ca8a04",
  IN_PROGRESS: "#c2410c",
  RESOLVED: "#16a34a",
  ESCALATED: "#7c3aed",
};

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "POTHOLE", label: "Pothole" },
  { value: "GARBAGE", label: "Garbage" },
  { value: "STREETLIGHT", label: "Streetlight" },
  { value: "WATER_LEAK", label: "Water Leak" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "MISC", label: "Misc" },
];

const AdminPanel = () => {
  const [incidents, setIncidents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ type: "", area: "", q: "" });
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");
  const [updatingIds, setUpdatingIds] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    const load = async () => {
      const [incidentsRes, departmentsRes] = await Promise.all([
        api.get("/incidents", { params: { scope: "all" } }),
        api.get("/departments"),
      ]);
      const list = incidentsRes.data.items || incidentsRes.data.incidents || [];
      setIncidents(list.map((item) => ({ ...item, id: item.id || item._id })));
      setDepartments(departmentsRes.data.items || departmentsRes.data.departments || []);
    };
    load();
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (filters.type && inc.incident_type !== filters.type) return false;
      if (filters.area && !inc.area?.toLowerCase().includes(filters.area.toLowerCase())) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (!inc.title?.toLowerCase().includes(q) && !inc.tracking_id?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [incidents, filters]);

  const statusCounts = useMemo(() => {
    return statusOptions.reduce((acc, status) => {
      acc[status.value] = filtered.filter((i) => i.status === status.value).length;
      return acc;
    }, {});
  }, [filtered]);

  const grouped = useMemo(() => {
    return statusOptions.reduce((acc, status) => {
      acc[status.value] = filtered.filter((i) => i.status === status.value);
      return acc;
    }, {});
  }, [filtered]);

  const getDeptId = (inc) => inc.department?._id || inc.department?.id || inc.department_id || "";

  const unroutedCount = useMemo(() => {
    return incidents.filter((inc) => inc.incident_type === "MISC" && !getDeptId(inc)).length;
  }, [incidents]);

  const applyUpdate = async (incidentId, payload) => {
    setUpdatingIds((prev) => (prev.includes(incidentId) ? prev : [...prev, incidentId]));
    try {
      await api.post(`/incidents/${incidentId}/status`, payload);
      setMessage("Incident updated.");
      setMessageTone("success");
    } catch (error) {
      setMessage("Update failed.");
      setMessageTone("error");
    } finally {
      setUpdatingIds((prev) => prev.filter((item) => item !== incidentId));
    }
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const newStatus = over.id;
    const incident = incidents.find((item) => item.id === active.id);
    if (!incident || incident.status === newStatus) return;

    setIncidents((prev) =>
      prev.map((item) => (item.id === incident.id ? { ...item, status: newStatus } : item))
    );

    applyUpdate(incident.id, { status: newStatus, department: getDeptId(incident) || null });
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active?.id || null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const ColumnBody = ({ id, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
      <div ref={setNodeRef} className={`kb-col-body ${isOver ? "kb-col-over" : ""}`} id={`body-${id}`}>
        {children}
      </div>
    );
  };

  const DraggableCard = ({ inc }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: inc.id,
    });
    const isUpdating = updatingIds.includes(inc.id);
    const style = {
      transform: CSS.Translate.toString(transform),
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`kb-card ${inc.is_overdue ? "overdue" : ""} ${inc.incident_type === "MISC" && !getDeptId(inc) ? "unrouted" : ""} ${isDragging || isUpdating ? "moving" : ""}`}
        {...listeners}
        {...attributes}
      >
        <div className="kb-card-top">
          <span style={{ fontSize: 11, background: "var(--n-100)", color: "var(--text-2)", padding: "2px 7px", borderRadius: 3, border: "1px solid var(--border)", fontWeight: 500 }}>
            {inc.incident_type_display || inc.incident_type}
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className={`badge priority-${inc.priority?.toLowerCase()}`}>
              {inc.priority_display || inc.priority}
            </span>
          </div>
        </div>

        <div className="kb-card-title">{inc.title}</div>
        <code className="kb-card-id">{inc.tracking_id}</code>

        <div className="kb-card-meta">
          <div className="kb-meta-row">
            <i className="bi bi-building"></i>
            {inc.department?.name || "No dept"}
          </div>
          <div className="kb-meta-row">
            <i className="bi bi-person"></i>
            {inc.reported_by?.username || "-"}
          </div>
          {inc.assigned_to ? (
            <div className="kb-meta-row">
              <i className="bi bi-tools"></i>
              {inc.assigned_to?.username}
            </div>
          ) : null}
          {inc.deadline ? (
            <div className={`kb-meta-row ${inc.is_overdue ? "overdue-row" : ""}`}>
              <i className="bi bi-clock"></i>
              {new Date(inc.deadline).toLocaleString()}
              {inc.is_overdue ? (
                <span className="badge status-escalated" style={{ fontSize: 10, marginLeft: 3 }}>
                  Overdue
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="kb-controls">
          {inc.incident_type === "MISC" ? (
            <select
              className="form-select kb-select kb-dept-sel"
              value={getDeptId(inc)}
              onChange={(e) => {
                const nextDeptId = e.target.value;
                const nextDept = departments.find(
                  (dept) => (dept.id || dept._id) === nextDeptId
                );
                setIncidents((prev) =>
                  prev.map((item) =>
                    item.id === inc.id
                      ? {
                          ...item,
                          department_id: nextDeptId,
                          department: nextDept
                            ? { _id: nextDept.id || nextDept._id, name: nextDept.name }
                            : item.department,
                        }
                      : item
                  )
                );
              }}
            >
              <option value="">Route to department...</option>
              {departments.map((dept) => (
                <option key={dept.id || dept._id} value={dept.id || dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          ) : null}
          <div className="kb-btn-row">
            <button
              className="btn btn-primary btn-sm kb-apply kb-apply-btn"
              disabled={isUpdating}
              onClick={() => applyUpdate(inc.id, { status: inc.status, department: getDeptId(inc) || null })}
            >
              {isUpdating ? (
                <span className="spinner-border" style={{ width: 11, height: 11, borderWidth: 2 }}></span>
              ) : (
                <i className="bi bi-check-lg"></i>
              )}
              {" "}Apply
            </button>
            <Link to={`/incidents/${inc.id}`} className="btn btn-outline-secondary btn-sm kb-view" title="View details">
              <i className="bi bi-arrow-up-right"></i>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const OverlayCard = ({ inc }) => {
    if (!inc) return null;
    return (
      <div className={`kb-card ${inc.is_overdue ? "overdue" : ""} ${inc.incident_type === "MISC" && !getDeptId(inc) ? "unrouted" : ""}`}>
        <div className="kb-card-top">
          <span style={{ fontSize: 11, background: "var(--n-100)", color: "var(--text-2)", padding: "2px 7px", borderRadius: 3, border: "1px solid var(--border)", fontWeight: 500 }}>
            {inc.incident_type_display || inc.incident_type}
          </span>
          <span className={`badge priority-${inc.priority?.toLowerCase()}`}>
            {inc.priority_display || inc.priority}
          </span>
        </div>

        <div className="kb-card-title">{inc.title}</div>
        <code className="kb-card-id">{inc.tracking_id}</code>

        <div className="kb-card-meta">
          <div className="kb-meta-row">
            <i className="bi bi-building"></i>
            {inc.department?.name || "No dept"}
          </div>
          <div className="kb-meta-row">
            <i className="bi bi-person"></i>
            {inc.reported_by?.username || "-"}
          </div>
          {inc.assigned_to ? (
            <div className="kb-meta-row">
              <i className="bi bi-tools"></i>
              {inc.assigned_to?.username}
            </div>
          ) : null}
          {inc.deadline ? (
            <div className={`kb-meta-row ${inc.is_overdue ? "overdue-row" : ""}`}>
              <i className="bi bi-clock"></i>
              {new Date(inc.deadline).toLocaleString()}
              {inc.is_overdue ? (
                <span className="badge status-escalated" style={{ fontSize: 10, marginLeft: 3 }}>
                  Overdue
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid px-4 page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Track and manage all reported incidents across departments</p>
        </div>
        <Link to="/report" className="btn btn-primary">
          <i className="bi bi-plus-lg"></i>New Report
        </Link>
      </div>

      <div className="kb-stats">
        <div className="kb-stat">
          <div className="kb-stat-val" style={{ color: "var(--text)" }}>
            {incidents.length}
          </div>
          <div className="kb-stat-lbl">Total</div>
        </div>
        {statusOptions.map((status) => (
          <div className="kb-stat" key={status.value}>
            <div className="kb-stat-val" style={{ color: "var(--text)" }}>
              {statusCounts[status.value] || 0}
            </div>
            <div className="kb-stat-lbl">{status.label}</div>
          </div>
        ))}
      </div>

      {unroutedCount ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--yellow-bg, #fefce8)",
            border: "1px solid #fde68a",
            borderRadius: "var(--r)",
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#92400e",
          }}
        >
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 15, flexShrink: 0 }}></i>
          <span>
            <strong>
              {unroutedCount} Miscellaneous incident{unroutedCount !== 1 ? "s" : ""}
            </strong>{" "}
            waiting for manual department routing.
          </span>
          <button
            className="btn btn-sm ms-auto"
            style={{ background: "#92400e", color: "#fff", fontSize: 12, padding: "3px 10px" }}
            onClick={() => setFilters((prev) => ({ ...prev, type: "MISC" }))}
          >
            Show them
          </button>
        </div>
      ) : null}

      <div className="kb-filter-bar">
        <select
          id="f-type"
          className="form-select form-select-sm"
          style={{ width: 160 }}
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
          id="f-area"
          className="form-control form-control-sm"
          style={{ width: 160 }}
          placeholder="Filter by area..."
          value={filters.area}
          onChange={(e) => setFilters((prev) => ({ ...prev, area: e.target.value }))}
        />
        <input
          type="text"
          id="f-search"
          className="form-control form-control-sm"
          style={{ width: 200 }}
          placeholder="Search title or ID..."
          value={filters.q}
          onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
        />
        <button
          id="f-reset"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setFilters({ type: "", area: "", q: "" })}
        >
          Reset
        </button>
        <span id="f-count" style={{ fontSize: 12.5, color: "var(--text-2)", marginLeft: "auto" }}>
          {filtered.length} incident{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        <div className="kb-wrap" id="kb-board">
          {statusOptions.map((status) => (
            <div
              className="kb-col"
              id={`col-${status.value}`}
              key={status.value}
              style={{ "--col-accent": statusColors[status.value] || "#888" }}
            >
              <div className="kb-col-header">
                <div className="kb-col-label">
                  <span className="kb-col-dot"></span>
                  {status.label}
                </div>
                <span className="kb-col-count">{grouped[status.value]?.length || 0}</span>
              </div>
              <ColumnBody id={status.value}>
                {grouped[status.value]?.length ? (
                  grouped[status.value].map((inc) => <DraggableCard key={inc.id} inc={inc} />)
                ) : (
                  <div className="kb-col-empty">No incidents here</div>
                )}
              </ColumnBody>
            </div>
          ))}
        </div>
        <DragOverlay>
          <OverlayCard inc={incidents.find((item) => item.id === activeId)} />
        </DragOverlay>
      </DndContext>

      <div className={`kb-toast ${message ? "show" : ""} ${messageTone === "error" ? "error" : ""}`} id="kb-toast">
        <i className={`bi ${messageTone === "error" ? "bi-x-circle-fill" : "bi-check-circle-fill"}`} id="kb-toast-icon"></i>
        <span id="kb-toast-msg">{message || "Updated."}</span>
      </div>
    </div>
  );
};

export default AdminPanel;
