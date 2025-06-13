const User = require("../../../src/domain/entities/User");

describe("User Entity", () => {
  describe("création d'utilisateur", () => {
    it("devrait créer un utilisateur valide", () => {
      const user = User.create("test@example.com", "John Doe");

      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("John Doe");
      expect(user.id).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("devrait normaliser l'email en minuscules", () => {
      const user = User.create("TEST@EXAMPLE.COM", "John Doe");
      expect(user.email).toBe("test@example.com");
    });

    it("devrait supprimer les espaces du nom", () => {
      const user = User.create("test@example.com", "  John Doe  ");
      expect(user.name).toBe("John Doe");
    });

    it("devrait rejeter un email manquant", () => {
      expect(() => User.create("", "John Doe")).toThrow(
        "Email et nom sont requis",
      );
      expect(() => User.create(null, "John Doe")).toThrow(
        "Email et nom sont requis",
      );
    });

    it("devrait rejeter un nom manquant", () => {
      expect(() => User.create("test@example.com", "")).toThrow(
        "Email et nom sont requis",
      );
      expect(() => User.create("test@example.com", null)).toThrow(
        "Email et nom sont requis",
      );
    });

    it("devrait rejeter un email invalide", () => {
      expect(() => User.create("invalid-email", "John Doe")).toThrow(
        "Format d'email invalide",
      );
      expect(() => User.create("test@", "John Doe")).toThrow(
        "Format d'email invalide",
      );
    });

    it("devrait rejeter un nom trop court", () => {
      expect(() => User.create("test@example.com", "A")).toThrow(
        "Le nom doit contenir au moins 2 caractères",
      );
    });
  });

  describe("validation email", () => {
    it("devrait valider des emails corrects", () => {
      const user = new User(1, "test@example.com", "John Doe");
      expect(user.isValidEmail()).toBe(true);
    });

    it("devrait rejeter des emails incorrects", () => {
      const user = new User(1, "invalid-email", "John Doe");
      expect(user.isValidEmail()).toBe(false);
    });
  });

  describe("sérialisation JSON", () => {
    it("devrait sérialiser correctement", () => {
      const date = new Date();
      const user = new User("123", "test@example.com", "John Doe", date);

      const json = user.toJSON();
      expect(json).toEqual({
        id: "123",
        email: "test@example.com",
        name: "John Doe",
        createdAt: date,
        updatedAt: expect.any(Date), // updatedAt est maintenant inclus
      });
    });
  });

  describe("updateProfile", () => {
    it("devrait mettre à jour le profil", () => {
      const user = new User("123", "test@example.com", "John Doe");
      const initialUpdatedAt = user.updatedAt;

      // Attendre un peu pour voir la différence de timestamp
      setTimeout(() => {
        user.updateProfile("Jane Doe");

        expect(user.name).toBe("Jane Doe");
        expect(user.updatedAt).not.toEqual(initialUpdatedAt);
      }, 10);
    });
  });
});
