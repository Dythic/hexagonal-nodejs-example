const UserService = require("../../../src/domain/services/UserService");
const User = require("../../../src/domain/entities/User");

describe("UserService", () => {
  let userService;
  let mockUserRepository;
  let mockEmailService;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    mockEmailService = {
      sendWelcomeEmail: jest.fn(),
    };

    userService = new UserService(mockUserRepository, mockEmailService);
  });

  describe("createUser", () => {
    it("devrait créer un utilisateur avec succès", async () => {
      const email = "test@example.com";
      const name = "John Doe";
      const savedUser = new User("123", email, name);

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue();

      const result = await userService.createUser(email, name);

      expect(result).toBe(savedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(savedUser);
    });

    it("devrait rejeter si l'utilisateur existe déjà", async () => {
      const existingUser = new User("123", "test@example.com", "Existing User");
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        userService.createUser("test@example.com", "John Doe"),
      ).rejects.toThrow("Un utilisateur avec cet email existe déjà");

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it("devrait créer l'utilisateur même si l'email échoue", async () => {
      const email = "test@example.com";
      const name = "John Doe";
      const savedUser = new User("123", email, name);

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockEmailService.sendWelcomeEmail.mockRejectedValue(
        new Error("Email service error"),
      );

      // Spy sur console.warn pour vérifier qu'il est appelé
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await userService.createUser(email, name);

      expect(result).toBe(savedUser);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Échec envoi email de bienvenue:",
        "Email service error",
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("getUserById", () => {
    it("devrait retourner un utilisateur existant", async () => {
      const user = new User("123", "test@example.com", "John Doe");
      mockUserRepository.findById.mockResolvedValue(user);

      const result = await userService.getUserById("123");

      expect(result).toBe(user);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("123");
    });

    it("devrait rejeter si l'utilisateur n'existe pas", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById("123")).rejects.toThrow(
        "Utilisateur non trouvé",
      );
    });

    it("devrait rejeter si l'ID est manquant", async () => {
      await expect(userService.getUserById(null)).rejects.toThrow(
        "ID utilisateur requis",
      );
    });
  });

  describe("getAllUsers", () => {
    it("devrait retourner tous les utilisateurs", async () => {
      const users = [
        new User("1", "user1@example.com", "User 1"),
        new User("2", "user2@example.com", "User 2"),
      ];
      mockUserRepository.findAll.mockResolvedValue(users);

      const result = await userService.getAllUsers();

      expect(result).toBe(users);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("devrait supprimer un utilisateur existant", async () => {
      const user = new User("123", "test@example.com", "John Doe");
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.delete.mockResolvedValue();

      const result = await userService.deleteUser("123");

      expect(result).toBe(user);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("123");
      expect(mockUserRepository.delete).toHaveBeenCalledWith("123");
    });

    it("devrait rejeter si l'utilisateur n'existe pas", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.deleteUser("123")).rejects.toThrow(
        "Utilisateur non trouvé",
      );
    });
  });
});
