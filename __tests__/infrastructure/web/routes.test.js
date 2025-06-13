// __tests__/infrastructure/web/routes.test.js
const express = require('express');
const request = require('supertest');
const createRoutes = require('../../../src/infrastructure/web/routes');

describe('Routes', () => {
  let app;
  let mockUserController;
  let mockAuthMiddleware;
  let mockRoleMiddleware;

  beforeEach(() => {
    mockUserController = {
      createUser: jest.fn((req, res) => res.json({ success: true, message: 'User created' })),
      getUser: jest.fn((req, res) => res.json({ success: true, data: { id: req.params.id } })),
      getAllUsers: jest.fn((req, res) => res.json({ success: true, data: [] })),
      deleteUser: jest.fn((req, res) => res.json({ success: true, message: 'User deleted' }))
    };

    mockAuthMiddleware = jest.fn((req, res, next) => {
      req.user = { id: '123', email: 'test@test.com' };
      req.auth = { hasRole: jest.fn().mockReturnValue(true) };
      next();
    });

    mockRoleMiddleware = {
      requireRole: jest.fn((role) => (req, res, next) => {
        if (req.auth && req.auth.hasRole(role)) {
          next();
        } else {
          res.status(403).json({ error: 'Forbidden' });
        }
      })
    };

    app = express();
    app.use(express.json());
  });

  describe('Routes sans authentification', () => {
    beforeEach(() => {
      const routes = createRoutes(mockUserController);
      app.use('/api', routes);
    });

    it('devrait créer un utilisateur sans auth', async () => {
      await request(app)
        .post('/api/users')
        .send({ email: 'test@test.com', name: 'Test User' })
        .expect(200);

      expect(mockUserController.createUser).toHaveBeenCalled();
    });

    it('devrait récupérer un utilisateur par ID sans auth', async () => {
      await request(app)
        .get('/api/users/123')
        .expect(200);

      expect(mockUserController.getUser).toHaveBeenCalled();
    });

    it('devrait lister tous les utilisateurs sans auth', async () => {
      await request(app)
        .get('/api/users')
        .expect(200);

      expect(mockUserController.getAllUsers).toHaveBeenCalled();
    });

    it('devrait supprimer un utilisateur sans auth', async () => {
      await request(app)
        .delete('/api/users/123')
        .expect(200);

      expect(mockUserController.deleteUser).toHaveBeenCalled();
    });

    it('devrait retourner le health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });
  });

  describe('Routes avec authentification seulement', () => {
    beforeEach(() => {
      const routes = createRoutes(mockUserController, mockAuthMiddleware);
      app.use('/api', routes);
    });

    it('devrait créer un utilisateur avec auth', async () => {
      await request(app)
        .post('/api/users')
        .send({ email: 'test@test.com', name: 'Test User' })
        .expect(200);

      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockUserController.createUser).toHaveBeenCalled();
    });

    it('devrait lister tous les utilisateurs avec auth simple', async () => {
      await request(app)
        .get('/api/users')
        .expect(200);

      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockUserController.getAllUsers).toHaveBeenCalled();
    });

    it('devrait appeler l\'auth middleware pour toutes les routes protégées', async () => {
      await request(app).post('/api/users').send({});
      await request(app).get('/api/users/123');
      await request(app).get('/api/users');
      await request(app).delete('/api/users/123');

      expect(mockAuthMiddleware).toHaveBeenCalledTimes(4);
    });

    it('devrait toujours permettre l\'accès au health check', async () => {
      await request(app)
        .get('/api/health')
        .expect(200);

      expect(mockAuthMiddleware).not.toHaveBeenCalled();
    });
  });

  describe('Routes avec authentification et rôles', () => {
    beforeEach(() => {
      const routes = createRoutes(mockUserController, mockAuthMiddleware, mockRoleMiddleware);
      app.use('/api', routes);
    });

    it('devrait protéger GET /users avec le rôle ADMIN', async () => {
      await request(app)
        .get('/api/users')
        .expect(200);

      expect(mockAuthMiddleware).toHaveBeenCalled();
      expect(mockRoleMiddleware.requireRole).toHaveBeenCalledWith('ADMIN');
    });

    it('devrait utiliser auth simple pour les autres routes', async () => {
      await request(app).post('/api/users').send({});
      await request(app).get('/api/users/123');
      await request(app).delete('/api/users/123');

      expect(mockAuthMiddleware).toHaveBeenCalledTimes(3);
      // requireRole ne devrait être appelé qu'une fois (pour GET /users dans un test précédent)
    });
  });

  describe('Health check détaillé', () => {
    beforeEach(() => {
      const routes = createRoutes(mockUserController);
      app.use('/api', routes);
    });

    it('devrait retourner les bonnes informations de santé', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        timestamp: expect.any(String),
        environment: expect.any(String)
      });

      // Vérifier que le timestamp est une date ISO valide
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });

    it('devrait retourner l\'environnement depuis NODE_ENV', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.environment).toBe('production');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Gestion des erreurs dans les routes', () => {
    beforeEach(() => {
      mockUserController.createUser = jest.fn((req, res) => {
        throw new Error('Controller error');
      });

      const routes = createRoutes(mockUserController);
      app.use('/api', routes);
    });

    it('devrait propager les erreurs du contrôleur', async () => {
      // L'erreur devrait être gérée par le middleware d'erreur global d'Express
      await request(app)
        .post('/api/users')
        .send({ email: 'test@test.com' })
        .expect(500);
    });
  });

  describe('Paramètres de route', () => {
    beforeEach(() => {
      const routes = createRoutes(mockUserController);
      app.use('/api', routes);
    });

    it('devrait passer les paramètres ID correctement', async () => {
      await request(app)
        .get('/api/users/abc-123-def')
        .expect(200);

      const call = mockUserController.getUser.mock.calls[0];
      const req = call[0];
      expect(req.params.id).toBe('abc-123-def');
    });

    it('devrait passer les paramètres ID pour delete', async () => {
      await request(app)
        .delete('/api/users/456')
        .expect(200);

      const call = mockUserController.deleteUser.mock.calls[0];
      const req = call[0];
      expect(req.params.id).toBe('456');
    });
  });

  describe('Méthodes HTTP', () => {
    beforeEach(() => {
      const routes = createRoutes(mockUserController);
      app.use('/api', routes);
    });

    it('devrait supporter POST pour créer des utilisateurs', async () => {
      await request(app)
        .post('/api/users')
        .send({ email: 'test@test.com' })
        .expect(200);
    });

    it('devrait supporter GET pour récupérer un utilisateur', async () => {
      await request(app)
        .get('/api/users/123')
        .expect(200);
    });

    it('devrait supporter GET pour lister les utilisateurs', async () => {
      await request(app)
        .get('/api/users')
        .expect(200);
    });

    it('devrait supporter DELETE pour supprimer un utilisateur', async () => {
      await request(app)
        .delete('/api/users/123')
        .expect(200);
    });

    it('ne devrait pas supporter PUT', async () => {
      await request(app)
        .put('/api/users/123')
        .expect(404);
    });

    it('ne devrait pas supporter PATCH', async () => {
      await request(app)
        .patch('/api/users/123')
        .expect(404);
    });
  });
});