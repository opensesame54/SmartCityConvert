const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const fetchGoogleProfile = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Unable to verify Google token");
  }

  if (!payload.email_verified) {
    throw new Error("Google email is not verified");
  }

  return payload;
};

const issueAccessToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const issueRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

const setRefreshCookie = (res, token) => {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const register = async (req, res) => {
  const { username, email, password, role, phone } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role: role || "citizen",
    phone,
  });

  const accessToken = issueAccessToken(user);
  const refreshToken = issueRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  return res.status(201).json({
    accessToken,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = issueAccessToken(user);
  const refreshToken = issueRefreshToken(user);
  setRefreshCookie(res, refreshToken);

  return res.json({
    accessToken,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

const refresh = async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    return res.status(401).json({ error: "Missing refresh token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accessToken = issueAccessToken(user);
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};

const logout = async (req, res) => {
  res.clearCookie("refresh_token");
  return res.json({ status: "ok" });
};

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: "Google OAuth is not configured" });
  }

  if (!idToken) {
    return res.status(400).json({ error: "Missing Google ID token" });
  }

  try {
    const googleProfile = await fetchGoogleProfile(idToken);
    const email = googleProfile.email.toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      const fallbackPasswordHash = await bcrypt.hash(`${email}:${Date.now()}`, 10);
      const username =
        googleProfile.name || email.split("@")[0] || `user_${Math.random().toString(36).slice(2, 8)}`;

      user = await User.create({
        username,
        email,
        passwordHash: fallbackPasswordHash,
        role: "citizen",
      });
    }

    const accessToken = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(401).json({ error: error.message || "Google authentication failed" });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  refresh,
  logout,
};
