const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { MongoClient } = require('mongodb');

// Services existants
const UserService = require('./src/domain/services/UserService');
const MongoUserRepository = require('./src/infrastructure/database/MongoUserRepository');
const NodemailerEmailService = require('./src/infrastructure/email/NodemailerEmailService');
const UserController = require('./src/infrastructure/web/UserController');
const createRoutes = require('./src/infrastructure/web/routes');

// Nouveaux services d'authentification
const AuthService = require('./src/domain/services/AuthService');
const MongoAuthRepository = require('./src/infrastructure/database/MongoAuthRepository');
const MongoRefreshTokenRepository = require('./src/infrastructure/database/MongoRefreshTokenRepository');
const BcryptPasswordService = require('./src/infrastructure/auth/BcryptPasswordService');
const JwtTokenService = require('./src/infrastructure/auth/JwtTokenService');
const AuthController = require('./src/infrastructure/web/AuthController');
const createAuthRoutes = require('./src/infrastructure/web/authRoutes');
const createAuthMiddleware = require('./src/infrastructure/web/middleware/authMiddleware');
const { requireRole } = require('./src/infrastructure/web/middleware/roleMiddleware');

async function createApp(config, emailService = null) {
  // Configuration des adaptateurs existants
  const mongoClient = new MongoClient(config.mongoUri);
  await mongoClient.connect();

  const userRepository = new MongoUserRepository(mongoClient, config.dbName);

  const actualEmailService = emailService || new NodemailerEmailService({
    host: config.email.host,
    port: config.email.port,
    user: config.email.user,
    pass: config.email.pass,
    from: config.email.from
  });

  // Nouveaux adaptateurs d'authentification
  const authRepository = new MongoAuthRepository(mongoClient, config.dbName);
  const refreshTokenRepository = new MongoRefreshTokenRepository(mongoClient, config.dbName);
  const passwordService = new BcryptPasswordService();
  const tokenService = new JwtTokenService();

  // Services métier
  const userService = new UserService(userRepository, actualEmailService);
  const authService = new AuthService(
    authRepository,
    refreshTokenRepository,
    userRepository,
    passwordService,
    tokenService
  );

  // Middlewares
  const authMiddleware = createAuthMiddleware(authService);

  // Contrôleurs
  const userController = new UserController(userService);
  const authController = new AuthController(authService);

  // Configuration Express
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes d'authentification
  app.use('/api/auth', createAuthRoutes(authController, authMiddleware));

  // Routes utilisateurs (avec authentification)
  app.use('/api', createRoutes(userController, authMiddleware, { requireRole }));

  // Middleware de gestion d'erreurs global
  app.use((err, req, res, next) => {
    console.error('Erreur non gérée:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  });

  // Route 404
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route non trouvée'
    });
  });

  return { app, mongoClient };
}

module.exports = createApp;