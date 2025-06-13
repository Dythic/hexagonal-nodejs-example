const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");
const createApp = require("../../app");

// Mock du service email pour les tests
class MockEmailService {
  async sendWelcomeEmail(user) {
    return Promise.resolve();
  }
}

describe("User API Integration Tests", () => {
  let app;
  let mongoServer;
  let mongoClient;

  beforeAll(async () => {
    // Configuration des variables d'environnement pour les tests
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.BCRYPT_ROUNDS = "10";

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const config = {
      mongoUri: uri,
      dbName: "integration_test",
      email: {
        host: "localhost",
        port: 587,
        user: "test",
        pass: "test",
        from: "test@example.com",
      },
    };

    try {
      const appData = await createApp(config, new MockEmailService());
      app = appData.app;
      mongoClient = appData.mongoClient;
    } catch (error) {
      console.error("Erreur lors de la création de l'app:", error);
      throw error;
    }
  });

  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    if (mongoClient) {
      // Nettoyer la base entre les tests
      const db = mongoClient.db("integration_test");
      await db.collection("users").deleteMany({});
      await db.collection("auth").deleteMany({});
      await db.collection("refresh_tokens").deleteMany({});
    }
  });

  describe("Health check", () => {
    it("devrait retourner le statut de santé", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body.status).toBe("OK");
      expect(response.body.timestamp).toBeDefined();
    });
  });

  // Note: Les tests des utilisateurs nécessitent maintenant l'authentification
  // Nous devons créer un utilisateur et nous authentifier d'abord
  describe("Flux complet d'utilisateur avec authentification", () => {
    let accessToken;

    beforeEach(async () => {
      // Créer et connecter un utilisateur admin pour les tests
      await request(app).post("/api/auth/register").send({
        email: "admin@example.com",
        name: "Admin User",
        password: "password123",
        role: "ADMIN",
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "admin@example.com",
        password: "password123",
      });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it("devrait créer, lire, et supprimer un utilisateur", async () => {
      // 1. Créer un utilisateur via l'API d'auth
      const createResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "integration@example.com",
          name: "Integration Test User",
          password: "password123",
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const userId = createResponse.body.data.user.id;
      expect(userId).toBeDefined();

      // 2. Récupérer l'utilisateur par ID (nécessite auth)
      const getResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.email).toBe("integration@example.com");
      expect(getResponse.body.data.name).toBe("Integration Test User");

      // 3. Lister tous les utilisateurs (admin seulement)
      const listResponse = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.data.length).toBeGreaterThan(0);

      // 4. Supprimer l'utilisateur
      await request(app)
        .delete(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // 5. Vérifier que l'utilisateur n'existe plus
      await request(app)
        .get(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
