import React, { useEffect } from "react";

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="position-fixed end-0 p-3" style={{ top: 68, zIndex: 9999 }}>
      <div id="liveToast" className="toast show align-items-center border-0" role="alert">
        <div className="d-flex">
          <div className="toast-body" id="toastBody">
            <i className="bi bi-bell-fill" style={{ color: "#60a5fa", fontSize: 13 }}></i>
            <span>{message}</span>
          </div>
          <button
            type="button"
            className="btn-close me-2 m-auto"
            onClick={onClose}
            style={{ filter: "invert(1)", opacity: 0.4 }}
          ></button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
