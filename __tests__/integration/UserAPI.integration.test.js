const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const createApp = require('../../app');

describe('User API Integration Tests', () => {
  let app;
  let mongoServer;
  let mongoClient;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    const config = {
      mongoUri: uri,
      dbName: 'integration_test',
      email: {
        host: 'fake.smtp.com',
        port: 587,
        user: 'fake_user',
        pass: 'fake_pass',
        from: 'test@example.com'
      }
    };

    const appData = await createApp(config);
    app = appData.app;
    mongoClient = appData.mongoClient;
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Nettoyer la base entre les tests
    const db = mongoClient.db('integration_test');
    await db.collection('users').deleteMany({});
  });

  describe('Flux complet d\'utilisateur', () => {
    it('devrait créer, lire, et supprimer un utilisateur', async () => {
      // 1. Créer un utilisateur
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          email: 'integration@example.com',
          name: 'Integration Test User'
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const userId = createResponse.body.data.id;
      expect(userId).toBeDefined();

      // 2. Récupérer l'utilisateur par ID
      const getResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(getResponse.body.data.email).toBe('integration@example.com');
      expect(getResponse.body.data.name).toBe('Integration Test User');

      // 3. Lister tous les utilisateurs
      const listResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(listResponse.body.data).toHaveLength(1);
      expect(listResponse.body.data[0].email).toBe('integration@example.com');

      // 4. Supprimer l'utilisateur
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      // 5. Vérifier que l'utilisateur n'existe plus
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('ne devrait pas créer deux utilisateurs avec le même email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'User 1'
      };

      // Premier utilisateur
      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Deuxième utilisateur avec le même email
      const response = await request(app)
        .post('/api/users')
        .send({ ...userData, name: 'User 2' })
        .expect(400);

      expect(response.body.error).toContain('existe déjà');
    });
  });

  describe('Validation des données', () => {
    it('devrait rejeter un email invalide', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'invalid-email',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.error).toContain('Format d\'email invalide');
    });

    it('devrait rejeter un nom trop court', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          name: 'A'
        })
        .expect(400);

      expect(response.body.error).toContain('au moins 2 caractères');
    });
  });

  describe('Health check', () => {
    it('devrait retourner le statut de santé', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});