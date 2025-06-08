process.env.NODE_ENV = 'test';

process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BCRYPT_ROUNDS = '10';

process.env.NODE_NO_WARNINGS = '1';

beforeAll(async () => {
  // Configuration globale avant tous les tests
});

afterAll(async () => {
  // Nettoyage global après tous les tests
});

jest.setTimeout(30000);

describe('Setup', () => {
  it('should configure test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});