import React, { useContext, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";

const Navbar = ({ wsStatus }) => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const links = useMemo(() => {
    const items = [{ to: "/", label: "Dashboard", icon: "bi bi-map" }];
    if (isAuthenticated && user?.role !== "citizen") {
      items.push({ to: "/analytics", label: "Analytics", icon: "bi bi-bar-chart-line" });
    }
    if (isAuthenticated && user?.role !== "admin") {
      items.push({ to: "/report", label: "Report Issue", icon: "bi bi-plus-circle" });
      items.push({ to: "/my-incidents", label: "My Reports", icon: "bi bi-list-ul" });
    }
    if (isAuthenticated && user?.role === "admin") {
      items.push({ to: "/admin-panel", label: "Admin Panel", icon: "bi bi-shield-check" });
    }
    if (isAuthenticated && user?.role === "worker") {
      items.push({ to: "/worker-panel", label: "My Tasks", icon: "bi bi-tools" });
    }
    return items;
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg sc-nav">
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/">
          <div className="sc-brand-icon">
            <i className="bi bi-building-fill-check" style={{ color: "#fff", fontSize: 14 }}></i>
          </div>
          SmartCity
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <i className="bi bi-list" style={{ fontSize: 18 }}></i>
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto gap-1">
            {links.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink className="nav-link" to={item.to}>
                  <i className={item.icon}></i>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center gap-2">
            <span id="ws-status">
              <i
                className="bi bi-circle-fill me-1"
                style={{
                  fontSize: ".5rem",
                  color:
                    wsStatus === "Live"
                      ? "#2ecc71"
                      : wsStatus === "Reconnecting..."
                      ? "#e67e22"
                      : "#e74c3c",
                }}
              ></i>
              {wsStatus}
            </span>

            <button id="darkModeToggle" title="Toggle theme" onClick={toggleTheme}>
              <i
                id="darkModeIcon"
                className={theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-fill"}
                style={{ fontSize: 13, pointerEvents: "none" }}
              ></i>
            </button>

            {isAuthenticated ? (
              <div className="dropdown">
                <button
                  className="sc-user-btn dropdown-toggle"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  type="button"
                >
                  <i className="bi bi-person-fill"></i>
                  {user?.username}
                </button>
                <ul
                  className={`dropdown-menu dropdown-menu-end ${userMenuOpen ? "show" : ""}`}
                  style={{ position: "absolute" }}
                >
                  <li>
                    <NavLink className="dropdown-item" to="/profile">
                      <i className="bi bi-person"></i>Profile
                    </NavLink>
                  </li>
                  <li><div className="dropdown-divider"></div></li>
                  <li>
                    <button className="dropdown-item sc-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right"></i>Sign out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <NavLink
                  to="/login"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "rgba(255,255,255,.7)",
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,.12)",
                    background: "rgba(255,255,255,.05)",
                    textDecoration: "none",
                    transition: "all 150ms",
                  }}
                >
                  Sign in
                </NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
