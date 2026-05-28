import React, { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import api from "../api/client";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

const Analytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/analytics");
      setData(response.data);
    };
    load();
  }, []);

  const typeChart = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.type_labels || [],
      datasets: [
        {
          label: "Incidents",
          data: data.type_counts || [],
          backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#0dcaf0", "#dc3545", "#fd7e14"],
          borderRadius: 6,
        },
      ],
    };
  }, [data]);

  const statusChart = useMemo(() => {
    if (!data) return null;
    const colors = {
      SUBMITTED: "#0d6efd",
      ASSIGNED: "#ffc107",
      IN_PROGRESS: "#fd7e14",
      RESOLVED: "#198754",
      ESCALATED: "#dc3545",
    };
    return {
      labels: data.status_labels || [],
      datasets: [
        {
          data: data.status_counts || [],
          backgroundColor: (data.status_labels || []).map((label) => colors[label] || "#aaa"),
        },
      ],
    };
  }, [data]);

  const trendChart = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.trend_labels || [],
      datasets: [
        {
          label: "Incidents Reported",
          data: data.trend_counts || [],
          borderColor: "#0d6efd",
          backgroundColor: "rgba(13,110,253,0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
        },
      ],
    };
  }, [data]);

  if (!data) {
    return (
      <div className="container-fluid px-4 page-wrap">
        <div className="card">
          <div className="card-body">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Incident trends, distribution, and geographic density</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="kpi">
            <div className="kpi-icon" style={{ background: "var(--blue-50)", color: "var(--blue)" }}>
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div>
              <div className="kpi-label">Total Incidents</div>
              <div className="kpi-value">{data.total || 0}</div>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="kpi">
            <div className="kpi-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div>
              <div className="kpi-label">Resolved</div>
              <div className="kpi-value">{data.resolved || 0}</div>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="kpi">
            <div className="kpi-icon" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
              <i className="bi bi-arrow-up-circle-fill"></i>
            </div>
            <div>
              <div className="kpi-label">Escalated</div>
              <div className="kpi-value">{data.escalated || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <i className="bi bi-bar-chart-fill" style={{ color: "var(--blue)" }}></i>Incidents by Type
            </div>
            <div className="card-body">
              {typeChart ? <Bar data={typeChart} options={{ plugins: { legend: { display: false } } }} /> : null}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <i className="bi bi-pie-chart-fill" style={{ color: "var(--purple)" }}></i>Incidents by Status
            </div>
            <div className="card-body">
              {statusChart ? <Doughnut data={statusChart} options={{ plugins: { legend: { position: "right" } }, cutout: "60%" }} /> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-7">
          <div className="card">
            <div className="card-header">
              <i className="bi bi-graph-up-arrow" style={{ color: "var(--green)" }}></i>30-Day Trend
            </div>
            <div className="card-body">
              {trendChart ? <Line data={trendChart} /> : null}
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card">
            <div className="card-header">
              <i className="bi bi-map-fill" style={{ color: "var(--orange)" }}></i>Incident Density
            </div>
            <div className="card-body p-2">
              <div id="heatmap">
                <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: 380 }}>
                  <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                  {(data.heatmap || []).map((point, index) => (
                    <CircleMarker
                      key={`${point[0]}-${point[1]}-${index}`}
                      center={[point[0], point[1]]}
                      radius={8}
                      pathOptions={{ color: "#dc3545", fillColor: "#dc3545", fillOpacity: 0.5, weight: 0 }}
                    />
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
