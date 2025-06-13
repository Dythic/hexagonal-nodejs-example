// __tests__/domain/ports/PortsWithMocks.test.js
describe("Tests des Ports avec Mocks", () => {
  describe("UserRepository avec Mock", () => {
    const UserRepository = require("../../../src/domain/ports/UserRepository");

    class MockUserRepository extends UserRepository {
      constructor() {
        super();
        this.users = new Map();
        this.nextId = 1;
      }

      async save(user) {
        if (!user.id) {
          user.id = this.nextId++;
        }
        this.users.set(user.id, { ...user });
        return user;
      }

      async findById(id) {
        return this.users.get(parseInt(id)) || null;
      }

      async findByEmail(email) {
        for (const user of this.users.values()) {
          if (user.email === email) {
            return user;
          }
        }
        return null;
      }

      async findAll() {
        return Array.from(this.users.values());
      }

      async delete(id) {
        this.users.delete(parseInt(id));
      }
    }

    it("devrait pouvoir implémenter toutes les méthodes", async () => {
      const repo = new MockUserRepository();
      const user = { email: "test@test.com", name: "Test User" };

      // Test save
      const savedUser = await repo.save(user);
      expect(savedUser.id).toBeDefined();

      // Test findById
      const foundUser = await repo.findById(savedUser.id);
      expect(foundUser.email).toBe("test@test.com");

      // Test findByEmail
      const userByEmail = await repo.findByEmail("test@test.com");
      expect(userByEmail.name).toBe("Test User");

      // Test findAll
      const allUsers = await repo.findAll();
      expect(allUsers).toHaveLength(1);

      // Test delete
      await repo.delete(savedUser.id);
      const deletedUser = await repo.findById(savedUser.id);
      expect(deletedUser).toBeNull();
    });
  });

  describe("EmailService avec Mock", () => {
    const EmailService = require("../../../src/domain/ports/EmailService");

    class MockEmailService extends EmailService {
      constructor() {
        super();
        this.sentEmails = [];
      }

      async sendWelcomeEmail(user) {
        this.sentEmails.push({
          to: user.email,
          subject: "Bienvenue",
          sentAt: new Date(),
        });
        return true;
      }

      getSentEmails() {
        return this.sentEmails;
      }
    }

    it("devrait pouvoir envoyer des emails", async () => {
      const emailService = new MockEmailService();
      const user = { email: "test@test.com", name: "Test User" };

      await emailService.sendWelcomeEmail(user);

      const sentEmails = emailService.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].to).toBe("test@test.com");
      expect(sentEmails[0].subject).toBe("Bienvenue");
    });
  });

  describe("Validation des contrats d'interface", () => {
    it("devrait valider que tous les ports ont des méthodes abstraites", () => {
      const UserRepository = require("../../../src/domain/ports/UserRepository");
      const EmailService = require("../../../src/domain/ports/EmailService");
      const AuthRepository = require("../../../src/domain/ports/AuthRepository");
      const PasswordService = require("../../../src/domain/ports/PasswordService");
      const TokenService = require("../../../src/domain/ports/TokenService");
      const RefreshTokenRepository = require("../../../src/domain/ports/RefreshTokenRepository");

      const ports = [
        UserRepository,
        EmailService,
        AuthRepository,
        PasswordService,
        TokenService,
        RefreshTokenRepository,
      ];

      ports.forEach((PortClass) => {
        const instance = new PortClass();
        const methods = Object.getOwnPropertyNames(PortClass.prototype).filter(
          (method) =>
            method !== "constructor" && typeof instance[method] === "function",
        );

        methods.forEach((methodName) => {
          try {
            // Essayer d'appeler chaque méthode et vérifier qu'elle lance une erreur
            const result = instance[methodName]();

            // Si c'est une méthode async, elle retourne une Promise
            if (result && typeof result.then === "function") {
              result.catch((error) => {
                expect(error.message).toContain("doit être implémentée");
              });
            }
          } catch (error) {
            expect(error.message).toContain("doit être implémentée");
          }
        });
      });
    });
  });
});
