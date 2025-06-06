const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { MongoClient } = require('mongodb');

const UserService = require('./src/domain/services/UserService');
const MongoUserRepository = require('./src/infrastructure/database/MongoUserRepository');
const NodemailerEmailService = require('./src/infrastructure/email/NodemailerEmailService');
const UserController = require('./src/infrastructure/web/UserController');
const createRoutes = require('./src/infrastructure/web/routes');

async function createApp(config) {
  // Configuration des adaptateurs
  const mongoClient = new MongoClient(config.mongoUri);
  await mongoClient.connect();
  
  const userRepository = new MongoUserRepository(mongoClient, config.dbName);
  
  const emailService = new NodemailerEmailService({
    host: config.email.host,
    port: config.email.port,
    user: config.email.user,
    pass: config.email.pass,
    from: config.email.from
  });
  
  // Service métier
  const userService = new UserService(userRepository, emailService);
  
  // Contrôleur web
  const userController = new UserController(userService);
  
  // Configuration Express
  const app = express();
  
  // Middlewares de sécurité
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Routes
  app.use('/api', createRoutes(userController));
  
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