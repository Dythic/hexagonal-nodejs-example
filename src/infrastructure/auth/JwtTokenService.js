const jwt = require("jsonwebtoken");
const TokenService = require("../../domain/ports/TokenService");

class JwtTokenService extends TokenService {
  constructor() {
    super();
    this.accessSecret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.accessExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    if (!this.accessSecret || !this.refreshSecret) {
      throw new Error("JWT secrets must be configured");
    }
  }

  generateAccessToken(payload) {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
      issuer: "hexagonal-app",
      audience: "hexagonal-app-users",
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
      issuer: "hexagonal-app",
      audience: "hexagonal-app-users",
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessSecret, {
        issuer: "hexagonal-app",
        audience: "hexagonal-app-users",
      });
    } catch (error) {
      throw new Error("Token d'accès invalide");
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        issuer: "hexagonal-app",
        audience: "hexagonal-app-users",
      });
    } catch (error) {
      throw new Error("Refresh token invalide");
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JwtTokenService;
