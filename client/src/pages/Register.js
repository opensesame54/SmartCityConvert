import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const GOOGLE_SCRIPT_ID = "google-identity-services-register";

const Register = () => {
  const navigate = useNavigate();
  const { register, googleLogin } = useContext(AuthContext);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) {
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            setError("");
            await googleLogin(response.credential);
            navigate("/");
          } catch (err) {
            setError(err?.response?.data?.error || "Google sign in failed");
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        shape: "pill",
        theme: "outline",
        text: "signup_with",
        size: "large",
        width: 320,
      });
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      initializeGoogle();
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => setError("Unable to load Google sign in");
    document.body.appendChild(script);
  }, [googleLogin, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to create account");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-header">
          <div className="auth-logo">
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Join Smart City to report and track civic issues</p>
        </div>

        <div className="auth-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                className="form-control"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            {error ? (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--red)",
                  marginTop: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <i className="bi bi-exclamation-circle"></i>
                {error}
              </div>
            ) : null}
            <div className="mt-4">
              <button type="submit" className="btn btn-primary w-100 btn-lg">
                Create Account
              </button>
            </div>

            {process.env.REACT_APP_GOOGLE_CLIENT_ID ? (
              <>
                <div className="text-center mt-3" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  or continue with
                </div>
                <div className="d-flex justify-content-center mt-2">
                  <div ref={googleButtonRef}></div>
                </div>
              </>
            ) : null}
          </form>
        </div>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
