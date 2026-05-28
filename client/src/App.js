import React, { useContext } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import MyIncidents from "./pages/MyIncidents";
import IncidentDetail from "./pages/IncidentDetail";
import AdminPanel from "./pages/AdminPanel";
import WorkerPanel from "./pages/WorkerPanel";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import { AuthContext } from "./context/AuthContext";

const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RequireRole = ({ roles, children }) => {
  const { user } = useContext(AuthContext);
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/report"
            element={
              <RequireAuth>
                <Report />
              </RequireAuth>
            }
          />
          <Route
            path="/my-incidents"
            element={
              <RequireAuth>
                <MyIncidents />
              </RequireAuth>
            }
          />
          <Route
            path="/incidents/:id"
            element={
              <RequireAuth>
                <IncidentDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <RequireAuth>
                <RequireRole roles={["admin"]}>
                  <AdminPanel />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/worker-panel"
            element={
              <RequireAuth>
                <RequireRole roles={["worker"]}>
                  <WorkerPanel />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth>
                <RequireRole roles={["admin", "worker"]}>
                  <Analytics />
                </RequireRole>
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
