const jwt = require("jsonwebtoken");

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

function sendUnauthorized(req, res, message) {
  if (isHtmlRequest(req)) {
    return res.redirect(`/user/login?error=${encodeURIComponent(message)}`);
  }

  return res.status(401).json({ message });
}

function auth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return sendUnauthorized(req, res, "Please login first");
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    res.clearCookie("token");

    if (error.name === "TokenExpiredError") {
      return sendUnauthorized(req, res, "Session expired. Please login again");
    }

    return sendUnauthorized(req, res, "Invalid token. Please login again");
  }
}

module.exports = auth;
