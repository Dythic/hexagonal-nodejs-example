// __tests__/domain/entities/Auth.test.js
const Auth = require('../../../src/domain/entities/Auth');

describe('Auth Entity', () => {
  const validUserId = 'user123';
  const validEmail = 'test@example.com';
  const validHashedPassword = 'hashedPassword123';

  describe('constructor', () => {
    it('devrait créer une instance Auth avec les valeurs par défaut', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword);

      expect(auth.userId).toBe(validUserId);
      expect(auth.email).toBe(validEmail);
      expect(auth.hashedPassword).toBe(validHashedPassword);
      expect(auth.role).toBe('USER');
      expect(auth.isActive).toBe(true);
      expect(auth.createdAt).toBeInstanceOf(Date);
      expect(auth.lastLoginAt).toBeNull();
    });

    it('devrait créer une instance Auth avec des valeurs personnalisées', () => {
      const customDate = new Date('2024-01-01');
      const auth = new Auth(validUserId, validEmail, validHashedPassword, 'ADMIN', false, customDate);

      expect(auth.role).toBe('ADMIN');
      expect(auth.isActive).toBe(false);
      expect(auth.createdAt).toBe(customDate);
    });
  });

  describe('create', () => {
    it('devrait créer une instance Auth valide', () => {
      const auth = Auth.create(validUserId, validEmail, validHashedPassword);

      expect(auth.userId).toBe(validUserId);
      expect(auth.email).toBe(validEmail);
      expect(auth.hashedPassword).toBe(validHashedPassword);
      expect(auth.role).toBe('USER');
    });

    it('devrait créer une instance Auth avec un rôle ADMIN', () => {
      const auth = Auth.create(validUserId, validEmail, validHashedPassword, 'ADMIN');

      expect(auth.role).toBe('ADMIN');
    });

    it('devrait rejeter un userId manquant', () => {
      expect(() => Auth.create('', validEmail, validHashedPassword))
        .toThrow('UserId, email et mot de passe hashé sont requis');
      expect(() => Auth.create(null, validEmail, validHashedPassword))
        .toThrow('UserId, email et mot de passe hashé sont requis');
    });

    it('devrait rejeter un email manquant', () => {
      expect(() => Auth.create(validUserId, '', validHashedPassword))
        .toThrow('UserId, email et mot de passe hashé sont requis');
      expect(() => Auth.create(validUserId, null, validHashedPassword))
        .toThrow('UserId, email et mot de passe hashé sont requis');
    });

    it('devrait rejeter un mot de passe hashé manquant', () => {
      expect(() => Auth.create(validUserId, validEmail, ''))
        .toThrow('UserId, email et mot de passe hashé sont requis');
      expect(() => Auth.create(validUserId, validEmail, null))
        .toThrow('UserId, email et mot de passe hashé sont requis');
    });

    it('devrait rejeter un rôle invalide', () => {
      expect(() => Auth.create(validUserId, validEmail, validHashedPassword, 'INVALID_ROLE'))
        .toThrow('Rôle invalide');
      expect(() => Auth.create(validUserId, validEmail, validHashedPassword, 'user'))
        .toThrow('Rôle invalide');
    });
  });

  describe('updateLastLogin', () => {
    it('devrait mettre à jour la date de dernière connexion', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword);
      const initialDate = auth.lastLoginAt;

      auth.updateLastLogin();

      expect(auth.lastLoginAt).not.toBe(initialDate);
      expect(auth.lastLoginAt).toBeInstanceOf(Date);
      expect(auth.lastLoginAt.getTime()).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('deactivate et activate', () => {
    it('devrait désactiver un utilisateur', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword);
      expect(auth.isActive).toBe(true);

      auth.deactivate();
      expect(auth.isActive).toBe(false);
    });

    it('devrait activer un utilisateur', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword, 'USER', false);
      expect(auth.isActive).toBe(false);

      auth.activate();
      expect(auth.isActive).toBe(true);
    });
  });

  describe('hasRole', () => {
    it('devrait permettre à USER d\'avoir le rôle USER', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword, 'USER');
      expect(auth.hasRole('USER')).toBe(true);
    });

    it('devrait permettre à ADMIN d\'avoir le rôle USER', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword, 'ADMIN');
      expect(auth.hasRole('USER')).toBe(true);
    });

    it('devrait permettre à ADMIN d\'avoir le rôle ADMIN', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword, 'ADMIN');
      expect(auth.hasRole('ADMIN')).toBe(true);
    });

    it('ne devrait pas permettre à USER d\'avoir le rôle ADMIN', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword, 'USER');
      expect(auth.hasRole('ADMIN')).toBe(false);
    });

    it('devrait gérer les rôles inexistants', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword, 'USER');
      expect(auth.hasRole('NONEXISTENT')).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('devrait sérialiser sans exposer le mot de passe', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword, 'ADMIN', true);
      auth.updateLastLogin();

      const json = auth.toJSON();

      expect(json).toEqual({
        userId: validUserId,
        email: validEmail,
        role: 'ADMIN',
        isActive: true,
        createdAt: auth.createdAt,
        lastLoginAt: auth.lastLoginAt
      });

      expect(json.hashedPassword).toBeUndefined();
    });

    it('devrait gérer lastLoginAt null', () => {
      const auth = new Auth(validUserId, validEmail, validHashedPassword);

      const json = auth.toJSON();

      expect(json.lastLoginAt).toBeNull();
    });
  });
});