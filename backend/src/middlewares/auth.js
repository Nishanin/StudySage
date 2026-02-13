const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  // In development, bypass authentication for all routes
  if (process.env.NODE_ENV === "development") {
    if (req.body && req.body.user && req.body.user.id) {
      req.user = { id: req.body.user.id };
    } else {
      req.user = { id: process.env.USER_ID };
    }
    return next();
  }

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: "fail",
      message: "Not authenticated",
    });
  }
};

module.exports = auth;
