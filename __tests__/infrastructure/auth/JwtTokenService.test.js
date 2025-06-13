// __tests__/infrastructure/auth/JwtTokenService.test.js
const JwtTokenService = require("../../../src/infrastructure/auth/JwtTokenService");
const jwt = require("jsonwebtoken");

describe("JwtTokenService", () => {
  let tokenService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.JWT_EXPIRES_IN = "15m";
    process.env.JWT_REFRESH_EXPIRES_IN = "7d";

    tokenService = new JwtTokenService();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("constructor", () => {
    it("devrait initialiser avec les secrets d'environnement", () => {
      expect(tokenService.accessSecret).toBe("test-access-secret");
      expect(tokenService.refreshSecret).toBe("test-refresh-secret");
      expect(tokenService.accessExpiresIn).toBe("15m");
      expect(tokenService.refreshExpiresIn).toBe("7d");
    });

    it("devrait utiliser les valeurs par défaut", () => {
      delete process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_REFRESH_EXPIRES_IN;

      const service = new JwtTokenService();
      expect(service.accessExpiresIn).toBe("15m");
      expect(service.refreshExpiresIn).toBe("7d");
    });

    it("devrait lancer une erreur si JWT_SECRET manque", () => {
      delete process.env.JWT_SECRET;

      expect(() => new JwtTokenService()).toThrow(
        "JWT secrets must be configured",
      );
    });

    it("devrait lancer une erreur si JWT_REFRESH_SECRET manque", () => {
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => new JwtTokenService()).toThrow(
        "JWT secrets must be configured",
      );
    });
  });

  describe("generateAccessToken", () => {
    it("devrait générer un token d'accès valide", () => {
      const payload = { userId: "123", email: "test@test.com", role: "USER" };
      const token = tokenService.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT format
    });

    it("devrait inclure les bonnes claims", () => {
      const payload = { userId: "123", email: "test@test.com", role: "USER" };
      const token = tokenService.generateAccessToken(payload);

      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe("123");
      expect(decoded.email).toBe("test@test.com");
      expect(decoded.role).toBe("USER");
      expect(decoded.iss).toBe("hexagonal-app");
      expect(decoded.aud).toBe("hexagonal-app-users");
      expect(decoded.exp).toBeDefined();
    });

    it("devrait générer des tokens différents pour le même payload", () => {
      const payload = { userId: "123" };
      const token1 = tokenService.generateAccessToken(payload);
      const token2 = tokenService.generateAccessToken(payload);

      // Les tokens sont différents car ils ont des timestamps (iat) différents
      expect(token1).not.toBe(token2);

      // Vérifier que le contenu principal est le même
      const decoded1 = jwt.decode(token1);
      const decoded2 = jwt.decode(token2);
      expect(decoded1.userId).toBe(decoded2.userId);
    });
  });

  describe("generateRefreshToken", () => {
    it("devrait générer un refresh token valide", () => {
      const payload = { userId: "123", tokenId: "abc123" };
      const token = tokenService.generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("devrait inclure les bonnes claims pour refresh token", () => {
      const payload = { userId: "123", tokenId: "abc123" };
      const token = tokenService.generateRefreshToken(payload);

      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe("123");
      expect(decoded.tokenId).toBe("abc123");
      expect(decoded.iss).toBe("hexagonal-app");
      expect(decoded.aud).toBe("hexagonal-app-users");
    });
  });

  describe("verifyAccessToken", () => {
    it("devrait vérifier un token valide", () => {
      const payload = { userId: "123", email: "test@test.com" };
      const token = tokenService.generateAccessToken(payload);

      const decoded = tokenService.verifyAccessToken(token);
      expect(decoded.userId).toBe("123");
      expect(decoded.email).toBe("test@test.com");
    });

    it("devrait rejeter un token invalide", () => {
      const invalidToken = "invalid.token.here";

      expect(() => tokenService.verifyAccessToken(invalidToken)).toThrow(
        "Token d'accès invalide",
      );
    });

    it("devrait rejeter un token expiré", () => {
      // Créer un token avec une expiration très courte
      process.env.JWT_EXPIRES_IN = "1ms";
      const shortLivedService = new JwtTokenService();

      const payload = { userId: "123" };
      const token = shortLivedService.generateAccessToken(payload);

      // Attendre que le token expire
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(() => shortLivedService.verifyAccessToken(token)).toThrow(
            "Token d'accès invalide",
          );
          resolve();
        }, 10);
      });
    });

    it("devrait rejeter un token avec mauvais issuer", () => {
      const payload = { userId: "123" };
      const token = jwt.sign(payload, "test-access-secret", {
        issuer: "wrong-issuer",
        audience: "hexagonal-app-users",
      });

      expect(() => tokenService.verifyAccessToken(token)).toThrow(
        "Token d'accès invalide",
      );
    });

    it("devrait rejeter un token avec mauvaise audience", () => {
      const payload = { userId: "123" };
      const token = jwt.sign(payload, "test-access-secret", {
        issuer: "hexagonal-app",
        audience: "wrong-audience",
      });

      expect(() => tokenService.verifyAccessToken(token)).toThrow(
        "Token d'accès invalide",
      );
    });
  });

  describe("verifyRefreshToken", () => {
    it("devrait vérifier un refresh token valide", () => {
      const payload = { userId: "123", tokenId: "abc123" };
      const token = tokenService.generateRefreshToken(payload);

      const decoded = tokenService.verifyRefreshToken(token);
      expect(decoded.userId).toBe("123");
      expect(decoded.tokenId).toBe("abc123");
    });

    it("devrait rejeter un refresh token invalide", () => {
      const invalidToken = "invalid.refresh.token";

      expect(() => tokenService.verifyRefreshToken(invalidToken)).toThrow(
        "Refresh token invalide",
      );
    });

    it("devrait rejeter un access token utilisé comme refresh token", () => {
      const payload = { userId: "123" };
      const accessToken = tokenService.generateAccessToken(payload);

      expect(() => tokenService.verifyRefreshToken(accessToken)).toThrow(
        "Refresh token invalide",
      );
    });
  });

  describe("decodeToken", () => {
    it("devrait décoder un token sans vérification", () => {
      const payload = { userId: "123", email: "test@test.com" };
      const token = tokenService.generateAccessToken(payload);

      const decoded = tokenService.decodeToken(token);
      expect(decoded.userId).toBe("123");
      expect(decoded.email).toBe("test@test.com");
    });

    it("devrait décoder un token expiré", () => {
      // Créer un token expiré
      const expiredToken = jwt.sign(
        { userId: "123", exp: Math.floor(Date.now() / 1000) - 60 },
        "test-access-secret",
      );

      const decoded = tokenService.decodeToken(expiredToken);
      expect(decoded.userId).toBe("123");
      expect(decoded.exp).toBeLessThan(Math.floor(Date.now() / 1000));
    });

    it("devrait retourner null pour un token malformé", () => {
      const malformedToken = "not.a.jwt";

      const decoded = tokenService.decodeToken(malformedToken);
      expect(decoded).toBeNull();
    });
  });

  describe("Intégration avec différents payloads", () => {
    it("devrait gérer des payloads complexes", () => {
      const complexPayload = {
        userId: "123",
        email: "test@test.com",
        role: "ADMIN",
        permissions: ["read", "write", "delete"],
        metadata: {
          lastLogin: new Date().toISOString(),
          loginCount: 42,
        },
      };

      const token = tokenService.generateAccessToken(complexPayload);
      const decoded = tokenService.verifyAccessToken(token);

      expect(decoded.userId).toBe("123");
      expect(decoded.permissions).toEqual(["read", "write", "delete"]);
      expect(decoded.metadata.loginCount).toBe(42);
    });

    it("devrait gérer des payloads avec des valeurs nulles", () => {
      const payload = {
        userId: "123",
        optionalField: null,
        undefinedField: undefined,
      };

      const token = tokenService.generateAccessToken(payload);
      const decoded = tokenService.verifyAccessToken(token);

      expect(decoded.userId).toBe("123");
      expect(decoded.optionalField).toBeNull();
      expect(decoded.undefinedField).toBeUndefined();
    });
  });
});
