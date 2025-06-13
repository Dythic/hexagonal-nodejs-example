// __tests__/infrastructure/web/middleware/roleMiddleware.test.js
const {
  requireRole,
} = require("../../../../src/infrastructure/web/middleware/roleMiddleware");
const Auth = require("../../../../src/domain/entities/Auth");

describe("RoleMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe("requireRole", () => {
    it("devrait permettre l'accès avec le rôle exact requis", () => {
      const middleware = requireRole("USER");

      req.auth = new Auth("123", "test@test.com", "hash", "USER");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("devrait permettre l'accès avec un rôle supérieur", () => {
      const middleware = requireRole("USER");

      req.auth = new Auth("123", "admin@test.com", "hash", "ADMIN");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("devrait refuser l'accès avec un rôle insuffisant", () => {
      const middleware = requireRole("ADMIN");

      req.auth = new Auth("123", "user@test.com", "hash", "USER");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Permissions insuffisantes",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("devrait refuser l'accès sans authentification", () => {
      const middleware = requireRole("USER");

      // req.auth n'est pas défini

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Authentification requise",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("devrait refuser l'accès avec req.auth null", () => {
      const middleware = requireRole("USER");

      req.auth = null;

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Authentification requise",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("devrait gérer les rôles personnalisés", () => {
      const middleware = requireRole("SUPER_ADMIN");

      // Créer un Auth avec un rôle personnalisé
      req.auth = new Auth("123", "super@test.com", "hash", "ADMIN");

      middleware(req, res, next);

      // Devrait refuser car ADMIN < SUPER_ADMIN (si implémenté)
      // Actuellement, hasRole ne gère que USER et ADMIN
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Permissions insuffisantes",
      });
    });
  });

  describe("Hiérarchie des rôles", () => {
    it("devrait respecter la hiérarchie USER < ADMIN", () => {
      // Test 1: USER peut accéder aux ressources USER
      const userMiddleware = requireRole("USER");
      req.auth = new Auth("123", "user@test.com", "hash", "USER");

      userMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Reset des mocks
      next.mockClear();
      res.status.mockClear();

      // Test 2: ADMIN peut accéder aux ressources USER
      req.auth = new Auth("123", "admin@test.com", "hash", "ADMIN");

      userMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Reset des mocks
      next.mockClear();
      res.status.mockClear();

      // Test 3: ADMIN peut accéder aux ressources ADMIN
      const adminMiddleware = requireRole("ADMIN");
      req.auth = new Auth("123", "admin@test.com", "hash", "ADMIN");

      adminMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Reset des mocks
      next.mockClear();
      res.status.mockClear();

      // Test 4: USER ne peut pas accéder aux ressources ADMIN
      req.auth = new Auth("123", "user@test.com", "hash", "USER");

      adminMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Intégration avec différents endpoints", () => {
    it("devrait protéger les routes administrateur", () => {
      const adminRoute = requireRole("ADMIN");

      req.url = "/api/admin/users";
      req.method = "GET";
      req.auth = new Auth("123", "user@test.com", "hash", "USER");

      adminRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Permissions insuffisantes",
      });
    });

    it("devrait permettre l'accès aux routes utilisateur", () => {
      const userRoute = requireRole("USER");

      req.url = "/api/users/profile";
      req.method = "GET";
      req.auth = new Auth("123", "user@test.com", "hash", "USER");

      userRoute(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("Cas d'erreur et edge cases", () => {
    it("devrait gérer req.auth avec des propriétés manquantes", () => {
      const middleware = requireRole("USER");

      req.auth = {}; // Objet vide sans méthode hasRole

      expect(() => middleware(req, res, next)).toThrow();
    });

    it("devrait gérer les rôles inexistants", () => {
      const middleware = requireRole("NONEXISTENT_ROLE");

      req.auth = new Auth("123", "user@test.com", "hash", "USER");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Permissions insuffisantes",
      });
    });

    it("devrait gérer les paramètres de rôle vides", () => {
      const middleware = requireRole("");

      req.auth = new Auth("123", "user@test.com", "hash", "USER");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
