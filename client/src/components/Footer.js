import React from "react";

const Footer = () => (
  <footer
    style={{
      background: "var(--n-900)",
      borderTop: "1px solid rgba(255,255,255,.06)",
      padding: "18px 0",
      marginTop: 48,
    }}
  >
    <div className="container-fluid px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.3)" }}>
        Smart City Incident Reporting
      </span>
      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.18)" }}>
        Municipal Corporation
      </span>
    </div>
  </footer>
);

export default Footer;
