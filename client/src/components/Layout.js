import React, { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Toast from "./Toast";
import { useSocket } from "../hooks/useSocket";

const Layout = () => {
  const [toast, setToast] = useState("");

  const handleIncidentUpdate = useCallback((data) => {
    if (data?.tracking_id) {
      setToast(`Incident ${data.tracking_id} -> ${data.status_display || data.status}`);
    }
    window.dispatchEvent(new CustomEvent("incident-update", { detail: data }));
  }, []);

  const { status } = useSocket(handleIncidentUpdate);

  return (
    <>
      <Navbar wsStatus={status} />
      <Toast message={toast} onClose={() => setToast("")} />
      <Outlet />
      <Footer />
    </>
  );
};

export default Layout;
