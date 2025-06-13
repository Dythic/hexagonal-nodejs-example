// __tests__/infrastructure/web/authRoutes.test.js
const express = require("express");
const request = require("supertest");
const createAuthRoutes = require("../../../src/infrastructure/web/authRoutes");

describe("AuthRoutes", () => {
  let app;
  let mockAuthController;
  let mockAuthMiddleware;

  beforeEach(() => {
    mockAuthController = {
      register: jest.fn((req, res) =>
        res.status(201).json({ success: true, message: "User registered" }),
      ),
      login: jest.fn((req, res) =>
        res.json({ success: true, message: "Login successful" }),
      ),
      refreshToken: jest.fn((req, res) =>
        res.json({ success: true, tokens: {} }),
      ),
      logout: jest.fn((req, res) =>
        res.json({ success: true, message: "Logged out" }),
      ),
      getProfile: jest.fn((req, res) =>
        res.json({ success: true, data: { user: req.user } }),
      ),
      changePassword: jest.fn((req, res) =>
        res.json({ success: true, message: "Password changed" }),
      ),
    };

    mockAuthMiddleware = jest.fn((req, res, next) => {
      req.user = { id: "123", email: "test@test.com" };
      req.auth = { hasRole: jest.fn().mockReturnValue(true) };
      next();
    });

    app = express();
    app.use(express.json());
  });

  describe("Routes publiques", () => {
    beforeEach(() => {
      const routes = createAuthRoutes(mockAuthController, mockAuthMiddleware);
      app.use("/api/auth", routes);
    });

    it("devrait permettre l'inscription sans authentification", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@test.com",
          name: "Test User",
          password: "password123",
        })
        .expect(201);

      expect(mockAuthController.register).toHaveBeenCalled();
      expect(mockAuthMiddleware).not.toHaveBeenCalled();
    });

    it("devrait permettre la connexion sans authentification", async () => {
      await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", password: "password123" })
        .expect(200);

      expect(mockAuthController.login).toHaveBeenCalled();
      expect(mockAuthMiddleware).not.toHaveBeenCalled();
    });

    it("devrait permettre le refresh token sans authentification", async () => {
      await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken: "refresh-token-123" })
        .expect(200);

      expect(mockAuthController.refreshToken).toHaveBeenCalled();
      expect(mockAuthMiddleware).not.toHaveBeenCalled();
    });
  });

  describe("Routes protégées", () => {
    beforeEach(() => {
      const routes = createAuthRoutes(mockAuthController, mockAuthMiddleware);
      app.use("/api/auth", routes);
    });

    it("devrait protéger la déconnexion", async () => {
      await request(app).post("/api/auth/logout").expect(200);

      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockAuthController.logout).toHaveBeenCalled();
    });

    it("devrait protéger l'accès au profil", async () => {
      await request(app).get("/api/auth/profile").expect(200);

      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockAuthController.getProfile).toHaveBeenCalled();
    });

    it("devrait protéger le changement de mot de passe (route générale)", async () => {
      await request(app)
        .post("/api/auth/change-password")
        .send({ currentPassword: "old", newPassword: "new" })
        .expect(200);

      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockAuthController.changePassword).toHaveBeenCalled();
    });

    it("devrait protéger le changement de mot de passe avec userId", async () => {
      await request(app)
        .post("/api/auth/users/123/change-password")
        .send({ currentPassword: "old", newPassword: "new" })
        .expect(200);

      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockAuthController.changePassword).toHaveBeenCalled();
    });
  });

  describe("Paramètres de route pour changement de mot de passe", () => {
    beforeEach(() => {
      const routes = createAuthRoutes(mockAuthController, mockAuthMiddleware);
      app.use("/api/auth", routes);
    });

    it("devrait passer l'userId depuis l'URL", async () => {
      await request(app)
        .post("/api/auth/users/user-456/change-password")
        .send({ currentPassword: "old", newPassword: "new" })
        .expect(200);

      const call = mockAuthController.changePassword.mock.calls[0];
      const req = call[0];
      expect(req.params.userId).toBe("user-456");
    });

    it("devrait fonctionner sans userId (route legacy)", async () => {
      await request(app)
        .post("/api/auth/change-password")
        .send({ currentPassword: "old", newPassword: "new" })
        .expect(200);

      const call = mockAuthController.changePassword.mock.calls[0];
      const req = call[0];
      expect(req.params.userId).toBeUndefined();
    });
  });

  describe("Méthodes HTTP supportées", () => {
    beforeEach(() => {
      const routes = createAuthRoutes(mockAuthController, mockAuthMiddleware);
      app.use("/api/auth", routes);
    });

    it("devrait supporter POST pour register", async () => {
      await request(app).post("/api/auth/register").send({}).expect(201);
    });

    it("devrait supporter POST pour login", async () => {
      await request(app).post("/api/auth/login").send({}).expect(200);
    });

    it("devrait supporter GET pour profile", async () => {
      await request(app).get("/api/auth/profile").expect(200);
    });

    it("ne devrait pas supporter GET pour register", async () => {
      await request(app).get("/api/auth/register").expect(404);
    });

    it("ne devrait pas supporter PUT pour login", async () => {
      await request(app).put("/api/auth/login").expect(404);
    });
  });

  describe("Gestion des erreurs dans authRoutes", () => {
    beforeEach(() => {
      mockAuthController.login = jest.fn((req, res) => {
        throw new Error("Login controller error");
      });

      const routes = createAuthRoutes(mockAuthController, mockAuthMiddleware);
      app.use("/api/auth", routes);
    });

    it("devrait propager les erreurs du contrôleur auth", async () => {
      await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", password: "password" })
        .expect(500);
    });
  });

  describe("Corps de requête et headers", () => {
    beforeEach(() => {
      const routes = createAuthRoutes(mockAuthController, mockAuthMiddleware);
      app.use("/api/auth", routes);
    });

    it("devrait passer le corps de la requête au contrôleur", async () => {
      const requestBody = { email: "test@test.com", password: "password123" };

      await request(app).post("/api/auth/login").send(requestBody).expect(200);

      const call = mockAuthController.login.mock.calls[0];
      const req = call[0];
      expect(req.body).toEqual(requestBody);
    });

    it("devrait préserver les headers de la requête", async () => {
      await request(app)
        .post("/api/auth/register")
        .set("User-Agent", "Test-Agent")
        .send({})
        .expect(201);

      const call = mockAuthController.register.mock.calls[0];
      const req = call[0];
      expect(req.headers["user-agent"]).toBe("Test-Agent");
    });
  });
});
