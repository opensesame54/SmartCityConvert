const express = require("express");
const {
  register,
  login,
  googleLogin,
  refresh,
  logout,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
