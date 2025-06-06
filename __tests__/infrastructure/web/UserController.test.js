const request = require('supertest');
const express = require('express');
const UserController = require('../../../src/infrastructure/web/UserController');
const createRoutes = require('../../../src/infrastructure/web/routes');
const User = require('../../../src/domain/entities/User');

describe('UserController', () => {
  let app;
  let mockUserService;

  beforeEach(() => {
    mockUserService = {
      createUser: jest.fn(),
      getUserById: jest.fn(),
      getAllUsers: jest.fn(),
      deleteUser: jest.fn()
    };

    const userController = new UserController(mockUserService);
    
    app = express();
    app.use(express.json());
    app.use('/api', createRoutes(userController));
  });

  describe('POST /api/users', () => {
    it('devrait créer un utilisateur avec succès', async () => {
      const userData = { email: 'test@example.com', name: 'John Doe' };
      const createdUser = new User('123', userData.email, userData.name);
      
      mockUserService.createUser.mockResolvedValue(createdUser);

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(mockUserService.createUser).toHaveBeenCalledWith(userData.email, userData.name);
    });

    it('devrait rejeter des données manquantes', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email et nom sont requis');
    });

    it('devrait gérer les erreurs de service', async () => {
      mockUserService.createUser.mockRejectedValue(new Error('Utilisateur existe déjà'));

      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', name: 'John Doe' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Utilisateur existe déjà');
    });
  });

  describe('GET /api/users/:id', () => {
    it('devrait retourner un utilisateur existant', async () => {
      const user = new User('123', 'test@example.com', 'John Doe');
      mockUserService.getUserById.mockResolvedValue(user);

      const response = await request(app)
        .get('/api/users/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('devrait retourner 404 pour un utilisateur inexistant', async () => {
      mockUserService.getUserById.mockRejectedValue(new Error('Utilisateur non trouvé'));

      const response = await request(app)
        .get('/api/users/123')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Utilisateur non trouvé');
    });
  });

  describe('GET /api/users', () => {
    it('devrait retourner tous les utilisateurs', async () => {
      const users = [
        new User('1', 'user1@example.com', 'User 1'),
        new User('2', 'user2@example.com', 'User 2')
      ];
      mockUserService.getAllUsers.mockResolvedValue(users);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('devrait supprimer un utilisateur existant', async () => {
      const user = new User('123', 'test@example.com', 'John Doe');
      mockUserService.deleteUser.mockResolvedValue(user);

      const response = await request(app)
        .delete('/api/users/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Utilisateur supprimé avec succès');
    });

    it('devrait retourner 404 pour un utilisateur inexistant', async () => {
      mockUserService.deleteUser.mockRejectedValue(new Error('Utilisateur non trouvé'));

      const response = await request(app)
        .delete('/api/users/123')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});