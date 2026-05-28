import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ phone: "", department: "" });

  return (
    <div className="container-fluid px-4 page-wrap">
      <div style={{ maxWidth: 560 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Profile</h1>
            <p className="page-subtitle">Manage your account details</p>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--blue-50)",
                  border: "2px solid var(--blue-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  color: "var(--blue)",
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-person-fill"></i>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-0.25px",
                    color: "var(--text)",
                  }}
                >
                  {user?.username || "Citizen"}
                </div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge status-assigned">{user?.role || "citizen"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <i className="bi bi-pencil" style={{ color: "var(--text-2)" }}></i>Update Details
          </div>
          <div className="card-body">
            <form>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Department (workers only)</label>
                <input
                  className="form-control"
                  value={form.department}
                  onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div style={{ paddingTop: 4 }}>
                <button type="button" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
