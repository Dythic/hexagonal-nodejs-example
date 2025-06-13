// __tests__/domain/ports/PortsContractValidation.test.js
describe('Validation des Contrats des Ports', () => {
  describe('Vérification des types de retour', () => {
    const UserRepository = require('../../../src/domain/ports/UserRepository');

    class TestUserRepository extends UserRepository {
      async save(user) { return user; }
      async findById(id) { return null; }
      async findByEmail(email) { return null; }
      async findAll() { return []; }
      async delete(id) { return; }
    }

    it('devrait retourner les bons types pour UserRepository', async () => {
      const repo = new TestUserRepository();
      
      const user = { email: 'test@test.com', name: 'Test' };
      const savedUser = await repo.save(user);
      expect(typeof savedUser).toBe('object');

      const foundUser = await repo.findById('123');
      expect(foundUser === null || typeof foundUser === 'object').toBe(true);

      const userByEmail = await repo.findByEmail('test@test.com');
      expect(userByEmail === null || typeof userByEmail === 'object').toBe(true);

      const allUsers = await repo.findAll();
      expect(Array.isArray(allUsers)).toBe(true);
    });
  });

  describe('Validation des paramètres', () => {
    const PasswordService = require('../../../src/domain/ports/PasswordService');

    class TestPasswordService extends PasswordService {
      async hash(password) {
        if (typeof password !== 'string') {
          throw new Error('Password must be a string');
        }
        return 'hashed_' + password;
      }

      async compare(password, hashedPassword) {
        if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
          throw new Error('Both parameters must be strings');
        }
        return password === hashedPassword.replace('hashed_', '');
      }
    }

    it('devrait valider les paramètres pour PasswordService', async () => {
      const service = new TestPasswordService();

      // Test avec des paramètres valides
      const hashed = await service.hash('password123');
      expect(hashed).toBe('hashed_password123');

      const isValid = await service.compare('password123', 'hashed_password123');
      expect(isValid).toBe(true);

      // Test avec des paramètres invalides
      await expect(service.hash(123)).rejects.toThrow('Password must be a string');
      await expect(service.compare(123, 'hash')).rejects.toThrow('Both parameters must be strings');
    });
  });
});