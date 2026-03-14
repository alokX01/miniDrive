const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const auth = require("../middleware/auth");

const router = express.Router();

function isHtmlRequest(req) {
  const contentType = req.headers["content-type"] || "";
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    return true;
  }

  const acceptHeader = req.headers.accept || "";
  return acceptHeader.includes("text/html");
}

function parseExpiryToMs(expiryValue) {
  if (!expiryValue) return 60 * 60 * 1000;
  const normalized = String(expiryValue).trim();
  const match = normalized.match(/^(\d+)([smhd])$/i);
  if (!match) return 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitInMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * unitInMs[unit];
}

router.get("/register", (req, res) => {
  res.render("register", {
    error: req.query.error || null,
    success: req.query.success || null,
  });
});

router.post(
  "/register",
  body("email").trim().isEmail().withMessage("Please enter a valid email"),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0]?.msg || "Invalid input data";
        if (isHtmlRequest(req)) {
          return res.status(400).render("register", {
            error: firstError,
            success: null,
          });
        }
        return res.status(400).json({
          message: firstError,
          error: errors.array(),
        });
      }

      const { email, username, password } = req.body;
      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedUsername = String(username).trim().toLowerCase();
      const existingUser = await userModel.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
      });

      if (existingUser) {
        const message = "User with email or username already exists";
        if (isHtmlRequest(req)) {
          return res.status(409).render("register", {
            error: message,
            success: null,
          });
        }
        return res.status(409).json({ message });
      }

      const hashPassword = await bcrypt.hash(password, 10);
      const newUser = await userModel.create({
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashPassword,
      });

      if (isHtmlRequest(req)) {
        return res.redirect(
          "/user/login?success=" +
            encodeURIComponent("Registration successful. Please login")
        );
      }

      return res.status(201).json({
        message: "registration successful",
        user: {
          id: newUser._id,
          email: newUser.email,
          username: newUser.username,
        },
      });
    } catch (err) {
      if (err.code === 11000) {
        const message = "User with email or username already exists";
        if (isHtmlRequest(req)) {
          return res.status(409).render("register", {
            error: message,
            success: null,
          });
        }
        return res.status(409).json({ message });
      }

      if (isHtmlRequest(req)) {
        return res.status(500).render("register", {
          error: "Failed to register user",
          success: null,
        });
      }

      return res.status(500).json({
        message: "failed to register user",
        error: err.message,
      });
    }
  }
);

router.get("/login", (req, res) => {
  res.render("login", {
    error: req.query.error || null,
    success: req.query.success || null,
  });
});

router.post(
  "/login",
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Please enter email or username"),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0]?.msg || "Invalid input data";
        if (isHtmlRequest(req)) {
          return res.status(400).render("login", {
            error: firstError,
            success: null,
          });
        }
        return res.status(400).json({
          message: firstError,
          error: errors.array(),
        });
      }

      if (!process.env.JWT_SECRET) {
        if (isHtmlRequest(req)) {
          return res.status(500).render("login", {
            error: "JWT secret is not configured",
            success: null,
          });
        }
        return res.status(500).json({ message: "JWT secret is not configured" });
      }

      const { email, password } = req.body;
      const identifier = String(email).trim().toLowerCase();
      const user = await userModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!user) {
        const message = "Invalid email or password";
        if (isHtmlRequest(req)) {
          return res.status(401).render("login", {
            error: message,
            success: null,
          });
        }
        return res.status(401).json({ message });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const message = "Invalid email or password";
        if (isHtmlRequest(req)) {
          return res.status(401).render("login", {
            error: message,
            success: null,
          });
        }
        return res.status(401).json({ message });
      }

      const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: parseExpiryToMs(expiresIn),
      });

      if (isHtmlRequest(req)) {
        return res.redirect("/home");
      }

      return res.status(200).json({
        message: "login successful",
      });
    } catch (err) {
      if (isHtmlRequest(req)) {
        return res.status(500).render("login", {
          error: "Failed to login",
          success: null,
        });
      }

      return res.status(500).json({
        message: "failed to login",
        error: err.message,
      });
    }
  }
);

router.post("/logout", auth, (req, res) => {
  res.clearCookie("token");

  if (isHtmlRequest(req)) {
    return res.redirect("/user/login?success=" + encodeURIComponent("Logged out"));
  }

  return res.status(200).json({ message: "logout successful" });
});

module.exports = router;
