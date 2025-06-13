function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        error: "Authentification requise",
      });
    }

    if (!requiredRole || requiredRole === null) {
      return res.status(403).json({
        success: false,
        error: "Absense de rôle",
      });
    }

    if (!req.auth.hasRole(requiredRole)) {
      return res.status(403).json({
        success: false,
        error: "Permissions insuffisantes",
      });
    }

    next();
  };
}

module.exports = { requireRole };
