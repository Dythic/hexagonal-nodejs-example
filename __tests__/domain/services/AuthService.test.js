const AuthService = require("../../../src/domain/services/AuthService");
const Auth = require("../../../src/domain/entities/Auth");
const User = require("../../../src/domain/entities/User");

describe("AuthService", () => {
  let authService;
  let mockAuthRepository;
  let mockRefreshTokenRepository;
  let mockUserRepository;
  let mockPasswordService;
  let mockTokenService;

  beforeEach(() => {
    mockAuthRepository = {
      findByEmail: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    mockRefreshTokenRepository = {
      save: jest.fn(),
      findByToken: jest.fn(),
      deleteByUserId: jest.fn(),
    };

    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    authService = new AuthService(
      mockAuthRepository,
      mockRefreshTokenRepository,
      mockUserRepository,
      mockPasswordService,
      mockTokenService,
    );
  });

  describe("register", () => {
    it("devrait créer un nouvel utilisateur avec succès", async () => {
      const email = "test@example.com";
      const name = "John Doe";
      const password = "password123";

      const savedUser = new User("user123", email, name);
      const hashedPassword = "hashedPassword123";

      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockAuthRepository.save.mockResolvedValue();

      const result = await authService.register(email, name, password);

      expect(result.user.email).toBe(email);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(password);
      expect(mockAuthRepository.save).toHaveBeenCalled();
    });

    it("devrait rejeter si l'utilisateur existe déjà", async () => {
      const existingAuth = new Auth(
        "user123",
        "test@example.com",
        "hashedPassword",
        "USER",
      );
      mockAuthRepository.findByEmail.mockResolvedValue(existingAuth);

      await expect(
        authService.register("test@example.com", "John", "password123"),
      ).rejects.toThrow("Un utilisateur avec cet email existe déjà");
    });
  });

  describe("login", () => {
    it("devrait connecter l'utilisateur avec succès", async () => {
      const email = "test@example.com";
      const password = "password123";
      const auth = new Auth("user123", email, "hashedPassword", "USER");
      const user = new User("user123", email, "John Doe");

      mockAuthRepository.findByEmail.mockResolvedValue(auth);
      mockPasswordService.compare.mockResolvedValue(true);
      mockUserRepository.findById.mockResolvedValue(user);
      mockTokenService.generateAccessToken.mockReturnValue("accessToken");
      mockTokenService.generateRefreshToken.mockReturnValue("refreshToken");
      mockRefreshTokenRepository.save.mockResolvedValue();

      const result = await authService.login(email, password);

      expect(result.user.email).toBe(email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe("accessToken");
    });

    it("devrait rejeter avec un mauvais mot de passe", async () => {
      const auth = new Auth(
        "user123",
        "test@example.com",
        "hashedPassword",
        "USER",
      );

      mockAuthRepository.findByEmail.mockResolvedValue(auth);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(
        authService.login("test@example.com", "wrongpassword"),
      ).rejects.toThrow("Email ou mot de passe incorrect");
    });
  });
});
