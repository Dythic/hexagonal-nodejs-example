// __tests__/infrastructure/auth/BcryptPasswordService.test.js
const BcryptPasswordService = require("../../../src/infrastructure/auth/BcryptPasswordService");

describe("BcryptPasswordService", () => {
  let passwordService;

  beforeEach(() => {
    // Sauvegarder les variables d'environnement
    process.env.BCRYPT_ROUNDS = "10";
    passwordService = new BcryptPasswordService();
  });

  afterEach(() => {
    // Restaurer les variables d'environnement
    delete process.env.BCRYPT_ROUNDS;
  });

  describe("constructor", () => {
    it("devrait utiliser BCRYPT_ROUNDS depuis l'environnement", () => {
      process.env.BCRYPT_ROUNDS = "8";
      const service = new BcryptPasswordService();
      expect(service.saltRounds).toBe(8);
    });

    it("devrait utiliser 12 par défaut si BCRYPT_ROUNDS n'est pas défini", () => {
      delete process.env.BCRYPT_ROUNDS;
      const service = new BcryptPasswordService();
      expect(service.saltRounds).toBe(12);
    });

    it("devrait parser la valeur string de BCRYPT_ROUNDS", () => {
      process.env.BCRYPT_ROUNDS = "15";
      const service = new BcryptPasswordService();
      expect(service.saltRounds).toBe(15);
    });
  });

  describe("hash", () => {
    it("devrait hasher un mot de passe valide", async () => {
      const password = "password123";
      const hashedPassword = await passwordService.hash(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword.startsWith("$2")).toBe(true); // Format bcrypt
    });

    it("devrait rejeter un mot de passe vide", async () => {
      await expect(passwordService.hash("")).rejects.toThrow(
        "Le mot de passe doit contenir au moins 6 caractères",
      );
    });

    it("devrait rejeter un mot de passe null", async () => {
      await expect(passwordService.hash(null)).rejects.toThrow(
        "Le mot de passe doit contenir au moins 6 caractères",
      );
    });

    it("devrait rejeter un mot de passe undefined", async () => {
      await expect(passwordService.hash(undefined)).rejects.toThrow(
        "Le mot de passe doit contenir au moins 6 caractères",
      );
    });

    it("devrait rejeter un mot de passe trop court", async () => {
      await expect(passwordService.hash("12345")).rejects.toThrow(
        "Le mot de passe doit contenir au moins 6 caractères",
      );
    });

    it("devrait accepter un mot de passe de 6 caractères exactement", async () => {
      const password = "123456";
      const hashedPassword = await passwordService.hash(password);
      expect(hashedPassword).toBeDefined();
    });

    it("devrait hasher différemment le même mot de passe", async () => {
      const password = "password123";
      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);

      expect(hash1).not.toBe(hash2); // Les salts sont différents
    });
  });

  describe("compare", () => {
    it("devrait valider un mot de passe correct", async () => {
      const password = "password123";
      const hashedPassword = await passwordService.hash(password);

      const isValid = await passwordService.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it("devrait rejeter un mot de passe incorrect", async () => {
      const password = "password123";
      const wrongPassword = "wrongpassword";
      const hashedPassword = await passwordService.hash(password);

      const isValid = await passwordService.compare(
        wrongPassword,
        hashedPassword,
      );
      expect(isValid).toBe(false);
    });

    it("devrait gérer les caractères spéciaux", async () => {
      const password = "p@ssw0rd!123#$%";
      const hashedPassword = await passwordService.hash(password);

      const isValid = await passwordService.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it("devrait être sensible à la casse", async () => {
      const password = "Password123";
      const hashedPassword = await passwordService.hash(password);

      const isValidLower = await passwordService.compare(
        "password123",
        hashedPassword,
      );
      const isValidUpper = await passwordService.compare(
        "PASSWORD123",
        hashedPassword,
      );
      const isValidCorrect = await passwordService.compare(
        "Password123",
        hashedPassword,
      );

      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
      expect(isValidCorrect).toBe(true);
    });
  });
});
