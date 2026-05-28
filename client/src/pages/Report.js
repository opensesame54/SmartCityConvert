import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import api from "../api/client";

const incidentTypes = [
  { value: "POTHOLE", label: "Pothole" },
  { value: "GARBAGE", label: "Garbage" },
  { value: "STREETLIGHT", label: "Streetlight" },
  { value: "WATER_LEAK", label: "Water Leak" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "MISC", label: "Misc" },
];

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "EMERGENCY", label: "Emergency" },
];

const MapClick = ({ onPin }) => {
  useMapEvents({
    click(event) {
      onPin(event.latlng.lat, event.latlng.lng, "map");
    },
  });
  return null;
};

const Report = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    incidentType: "POTHOLE",
    priority: "LOW",
    title: "",
    description: "",
    address: "",
    area: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [coords, setCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("");
  const [gpsTone, setGpsTone] = useState("info");
  const [detecting, setDetecting] = useState(false);

  const gpsStyles = useMemo(() => {
    const tones = {
      info: { bg: "var(--blue-bg)", border: "var(--blue-100)", text: "var(--blue)" },
      success: { bg: "var(--green-bg)", border: "var(--green-100)", text: "var(--green)" },
      warn: { bg: "var(--yellow-bg)", border: "#fde68a", text: "#92400e" },
      error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
    };
    return tones[gpsTone] || tones.info;
  }, [gpsTone]);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(image);
  }, [image]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      if (!data || !data.display_name) return;
      const address = data.display_name;
      const area =
        data.address?.suburb ||
        data.address?.city_district ||
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        "";
      setForm((prev) => ({ ...prev, address, area: area || prev.area }));
    } catch (error) {
      // ignore
    }
  };

  const pinLocation = (lat, lng, source, accuracyMeters) => {
    const latFixed = Number(lat).toFixed(6);
    const lngFixed = Number(lng).toFixed(6);
    setCoords({ lat: latFixed, lng: lngFixed });

    if (source === "gps") {
      const accText = Number.isFinite(accuracyMeters)
        ? ` (accuracy +- ${Math.round(accuracyMeters)} m)`
        : "";
      setGpsTone("success");
      setGpsStatus(`Location captured from your device${accText}. You can drag the marker.`);
    } else if (source === "map") {
      setGpsTone("info");
      setGpsStatus("Location pinned from map. You can drag the marker.");
    } else if (source === "drag") {
      setGpsTone("info");
      setGpsStatus("Marker moved. Location updated.");
    }

    reverseGeocode(latFixed, lngFixed);
  };

  const detectCurrentLocation = (isAuto) => {
    if (!navigator.geolocation) {
      setGpsTone("warn");
      setGpsStatus("This browser does not support geolocation. Please click on the map.");
      return;
    }

    setDetecting(true);
    if (!isAuto) {
      setGpsTone("info");
      setGpsStatus("Detecting your current location...");
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const c = position.coords;
        pinLocation(c.latitude, c.longitude, "gps", c.accuracy);
        setDetecting(false);
      },
      (error) => {
        setDetecting(false);
        setGpsTone(isAuto ? "warn" : "error");
        if (error.code === 1) {
          setGpsStatus("Location permission denied. Please allow access or click on the map.");
        } else if (error.code === 2) {
          setGpsStatus("Location unavailable. Try again or click on the map.");
        } else if (error.code === 3) {
          setGpsStatus("Location request timed out. Try again or click on the map.");
        } else {
          setGpsStatus("Unable to detect location. Please click on the map.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!coords?.lat || !coords?.lng) {
      alert("Please set location first using GPS or by clicking on the map.");
      return;
    }

    const payload = new FormData();
    payload.append("incident_type", form.incidentType);
    payload.append("priority", form.priority);
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("address", form.address);
    payload.append("area", form.area);
    payload.append("latitude", coords.lat);
    payload.append("longitude", coords.lng);
    if (image) payload.append("image", image);

    const response = await api.post("/incidents", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const created = response.data.incident || response.data;
    if (created?.id || created?._id) {
      navigate(`/incidents/${created.id || created._id}`);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => detectCurrentLocation(true), 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-fluid px-4 page-wrap">
      <div className="report-wrap">
        <div className="page-header">
          <div>
            <h1 className="page-title">Report an Incident</h1>
            <p className="page-subtitle">Submit a civic issue for municipal review and resolution</p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card">
              <div className="card-header">
                <i className="bi bi-clipboard-plus" style={{ color: "var(--blue)" }}></i>Incident Details
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit} id="report-form" noValidate>
                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label">Issue Type</label>
                      <select
                        className="form-select"
                        value={form.incidentType}
                        onChange={(e) => setForm((prev) => ({ ...prev, incidentType: e.target.value }))}
                      >
                        {incidentTypes.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={form.priority}
                        onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                      >
                        {priorities.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      className="form-control"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    ></textarea>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-7">
                      <label className="form-label">Address</label>
                      <input
                        className="form-control"
                        value={form.address}
                        onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="col-sm-5">
                      <label className="form-label">Area / Ward</label>
                      <input
                        className="form-control"
                        value={form.area}
                        onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">
                      Photo <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input
                      className="form-control"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
                    />
                    {imagePreview ? (
                      <div className="mt-2" id="img-preview">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ maxHeight: 120, borderRadius: "var(--r)", border: "1px solid var(--border)" }}
                        />
                      </div>
                    ) : null}
                  </div>

                  {coords ? (
                    <div
                      id="location-pill"
                      style={{
                        display: "flex",
                        background: "var(--green-bg)",
                        border: "1px solid var(--green-100)",
                        borderRadius: "var(--r)",
                        padding: "9px 13px",
                        fontSize: 12.5,
                        color: "var(--green)",
                        marginBottom: 16,
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <i className="bi bi-pin-map-fill"></i>
                      <span>
                        Location pinned: {coords.lat}, {coords.lng}
                      </span>
                    </div>
                  ) : null}

                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary btn-lg" id="submit-btn">
                      <i className="bi bi-send-fill"></i>Submit Report
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className="bi bi-geo-alt-fill" style={{ color: "var(--red)" }}></i>
                <span id="map-hint-text">Detect your location automatically or click on the map to pin it</span>
              </div>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => detectCurrentLocation(false)}
                disabled={detecting}
              >
                {detecting ? "Detecting..." : "Current Location"}
              </button>
            </div>

            {gpsStatus ? (
              <div
                id="gps-status"
                style={{
                  display: "block",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  padding: "8px 10px",
                  fontSize: 12.5,
                  marginBottom: 8,
                  background: gpsStyles.bg,
                  borderColor: gpsStyles.border,
                  color: gpsStyles.text,
                }}
              >
                {gpsStatus}
              </div>
            ) : null}

            <div id="report-map" style={{ height: 420, width: "100%", borderRadius: 8, border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,.07)" }}>
              <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%" }}>
                <TileLayer
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                <MapClick onPin={pinLocation} />
                {coords ? (
                  <Marker
                    position={[Number(coords.lat), Number(coords.lng)]}
                    draggable
                    eventHandlers={{
                      dragend: (event) => {
                        const marker = event.target;
                        const position = marker.getLatLng();
                        pinLocation(position.lat, position.lng, "drag");
                      },
                    }}
                  />
                ) : null}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
