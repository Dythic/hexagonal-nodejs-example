// __tests__/app.test.js
const createApp = require("../app");
const { MongoClient } = require("mongodb");

// Mock des dépendances
jest.mock("mongodb");
jest.mock("./src/infrastructure/email/NodemailerEmailService");

describe("App Configuration", () => {
  let mockMongoClient;

  beforeEach(() => {
    mockMongoClient = {
      connect: jest.fn().mockResolvedValue(),
      db: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({}),
      }),
      close: jest.fn().mockResolvedValue(),
    };

    MongoClient.mockImplementation(() => mockMongoClient);

    // Variables d'environnement pour les tests
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.BCRYPT_ROUNDS = "10";
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.BCRYPT_ROUNDS;
  });

  describe("Création de l'application", () => {
    it("devrait créer l'application avec la configuration par défaut", async () => {
      const config = {
        mongoUri: "mongodb://localhost:27017",
        dbName: "test_db",
        email: {
          host: "localhost",
          port: 587,
          user: "test",
          pass: "test",
          from: "test@test.com",
        },
      };

      const { app, mongoClient } = await createApp(config);

      expect(app).toBeDefined();
      expect(mongoClient).toBe(mockMongoClient);
      expect(mockMongoClient.connect).toHaveBeenCalled();
    });

    it("devrait créer l'application avec un service email personnalisé", async () => {
      const config = {
        mongoUri: "mongodb://localhost:27017",
        dbName: "test_db",
        email: {},
      };

      class MockEmailService {
        async sendWelcomeEmail() {
          return true;
        }
      }

      const customEmailService = new MockEmailService();
      const { app, mongoClient } = await createApp(config, customEmailService);

      expect(app).toBeDefined();
      expect(mongoClient).toBe(mockMongoClient);
    });

    it("devrait configurer les middlewares de sécurité", async () => {
      const config = {
        mongoUri: "mongodb://localhost:27017",
        dbName: "test_db",
        email: {
          host: "localhost",
          port: 587,
          user: "test",
          pass: "test",
          from: "test@test.com",
        },
      };

      const { app } = await createApp(config);

      // Vérifier que l'app est bien configurée (test indirect)
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe("function");
    });
  });

  describe("Configuration des repositories", () => {
    it("devrait configurer tous les repositories MongoDB", async () => {
      const config = {
        mongoUri: "mongodb://localhost:27017",
        dbName: "test_db",
        email: {
          host: "localhost",
          port: 587,
          user: "test",
          pass: "test",
          from: "test@test.com",
        },
      };

      await createApp(config);

      expect(mockMongoClient.db).toHaveBeenCalledWith("test_db");
      expect(mockMongoClient.db().collection).toHaveBeenCalledWith("users");
      expect(mockMongoClient.db().collection).toHaveBeenCalledWith("auth");
      expect(mockMongoClient.db().collection).toHaveBeenCalledWith(
        "refresh_tokens",
      );
    });
  });

  describe("Gestion des erreurs de configuration", () => {
    it("devrait propager les erreurs de connexion MongoDB", async () => {
      mockMongoClient.connect.mockRejectedValue(
        new Error("MongoDB connection failed"),
      );

      const config = {
        mongoUri: "mongodb://invalid:27017",
        dbName: "test_db",
        email: {
          host: "localhost",
          port: 587,
          user: "test",
          pass: "test",
          from: "test@test.com",
        },
      };

      await expect(createApp(config)).rejects.toThrow(
        "MongoDB connection failed",
      );
    });

    it("devrait propager les erreurs de configuration JWT", async () => {
      delete process.env.JWT_SECRET;

      const config = {
        mongoUri: "mongodb://localhost:27017",
        dbName: "test_db",
        email: {
          host: "localhost",
          port: 587,
          user: "test",
          pass: "test",
          from: "test@test.com",
        },
      };

      await expect(createApp(config)).rejects.toThrow(
        "JWT secrets must be configured",
      );
    });
  });

  describe("Structure de l'application retournée", () => {
    it("devrait retourner un objet avec app et mongoClient", async () => {
      const config = {
        mongoUri: "mongodb://localhost:27017",
        dbName: "test_db",
        email: {
          host: "localhost",
          port: 587,
          user: "test",
          pass: "test",
          from: "test@test.com",
        },
      };

      const result = await createApp(config);

      expect(result).toHaveProperty("app");
      expect(result).toHaveProperty("mongoClient");
      expect(typeof result.app.use).toBe("function");
      expect(typeof result.mongoClient.connect).toBe("function");
    });
  });
});
