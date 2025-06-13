// __tests__/infrastructure/web/middleware/authMiddleware.test.js
const createAuthMiddleware = require('../../../../src/infrastructure/web/middleware/authMiddleware');
const Auth = require('../../../../src/domain/entities/Auth');

describe('AuthMiddleware', () => {
  let authMiddleware;
  let mockAuthService;
  let req, res, next;

  beforeEach(() => {
    mockAuthService = {
      getUserFromToken: jest.fn()
    };

    authMiddleware = createAuthMiddleware(mockAuthService);

    req = {
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  describe('Token présent et valide', () => {
    it('devrait authentifier avec un token Bearer valide', async () => {
      const mockUser = {
        id: '123',
        email: 'test@test.com',
        name: 'Test User'
      };

      const mockAuth = {
        userId: '123',
        email: 'test@test.com',
        hashedPassword: 'hash',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      req.headers.authorization = 'Bearer valid-token-123';
      mockAuthService.getUserFromToken.mockResolvedValue({
        user: mockUser,
        auth: mockAuth
      });

      await authMiddleware(req, res, next);

      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('valid-token-123');
      expect(req.user).toEqual(mockUser);
      expect(req.auth).toBeInstanceOf(Auth);
      expect(req.auth.userId).toBe('123');
      expect(req.auth.role).toBe('USER');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('devrait préserver les propriétés auth complètes', async () => {
      const mockUser = { id: '123', email: 'test@test.com', name: 'Test User' };
      const mockAuth = {
        userId: '123',
        email: 'test@test.com',
        hashedPassword: 'hash',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date('2024-01-15')
      };

      req.headers.authorization = 'Bearer admin-token';
      mockAuthService.getUserFromToken.mockResolvedValue({
        user: mockUser,
        auth: mockAuth
      });

      await authMiddleware(req, res, next);

      expect(req.auth.userId).toBe('123');
      expect(req.auth.email).toBe('test@test.com');
      expect(req.auth.role).toBe('ADMIN');
      expect(req.auth.isActive).toBe(true);
      expect(req.auth.lastLoginAt).toEqual(mockAuth.lastLoginAt);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Token manquant ou invalide', () => {
    it('devrait rejeter les requêtes sans header Authorization', async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token d\'authentification requis'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter les headers Authorization vides', async () => {
      req.headers.authorization = '';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token d\'authentification requis'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter les headers sans Bearer', async () => {
      req.headers.authorization = 'Basic invalid-token';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token d\'authentification requis'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter les tokens Bearer malformés', async () => {
      req.headers.authorization = 'Bearer';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token d\'authentification requis'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait rejeter les tokens Bearer avec seulement des espaces', async () => {
      req.headers.authorization = 'Bearer   ';

      await authMiddleware(req, res, next);

      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token invalide'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Erreurs du service d\'authentification', () => {
    it('devrait gérer les tokens expirés', async () => {
      req.headers.authorization = 'Bearer expired-token';
      mockAuthService.getUserFromToken.mockRejectedValue(new Error('Token expiré'));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token invalide'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait gérer les utilisateurs désactivés', async () => {
      req.headers.authorization = 'Bearer disabled-user-token';
      mockAuthService.getUserFromToken.mockRejectedValue(new Error('Utilisateur désactivé'));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token invalide'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de base de données', async () => {
      req.headers.authorization = 'Bearer valid-token';
      mockAuthService.getUserFromToken.mockRejectedValue(new Error('Database connection failed'));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token invalide'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs inattendues', async () => {
      req.headers.authorization = 'Bearer valid-token';
      mockAuthService.getUserFromToken.mockRejectedValue(new Error('Unexpected error'));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token invalide'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Formats de token alternatifs', () => {
    it('devrait gérer Bearer avec casse différente', async () => {
      req.headers.authorization = 'bearer valid-token';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token d\'authentification requis'
      });
    });

    it('devrait gérer BEARER en majuscules', async () => {
      req.headers.authorization = 'BEARER valid-token';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token d\'authentification requis'
      });
    });

    it('devrait extraire correctement le token après Bearer', async () => {
      const mockUser = { id: '123', email: 'test@test.com', name: 'Test User' };
      const mockAuth = {
        userId: '123',
        email: 'test@test.com',
        hashedPassword: 'hash',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: null
      };

      req.headers.authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      mockAuthService.getUserFromToken.mockResolvedValue({
        user: mockUser,
        auth: mockAuth
      });

      await authMiddleware(req, res, next);

      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Intégration avec différents types de requêtes', () => {
    it('devrait fonctionner avec GET', async () => {
      req.method = 'GET';
      req.url = '/api/users';
      req.headers.authorization = 'Bearer valid-token';

      const mockUser = { id: '123', email: 'test@test.com', name: 'Test User' };
      const mockAuth = {
        userId: '123',
        email: 'test@test.com',
        hashedPassword: 'hash',
        role: 'USER',
        isActive: true,
        createdAt: new Date()
      };

      mockAuthService.getUserFromToken.mockResolvedValue({
        user: mockUser,
        auth: mockAuth
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('devrait fonctionner avec POST', async () => {
      req.method = 'POST';
      req.body = { data: 'test' };
      req.headers.authorization = 'Bearer valid-token';

      const mockUser = { id: '123', email: 'test@test.com', name: 'Test User' };
      const mockAuth = {
        userId: '123',
        email: 'test@test.com',
        hashedPassword: 'hash',
        role: 'USER',
        isActive: true,
        createdAt: new Date()
      };

      mockAuthService.getUserFromToken.mockResolvedValue({
        user: mockUser,
        auth: mockAuth
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ data: 'test' }); // Body préservé
    });
  });
});