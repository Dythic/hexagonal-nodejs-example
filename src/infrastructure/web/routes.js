const express = require('express');

function createRoutes(userController, authMiddleware = null, roleMiddleware = null) {
  const router = express.Router();

  // Routes utilisateurs protégées
  if (authMiddleware) {
    router.post('/users', authMiddleware, (req, res) => userController.createUser(req, res));
    router.get('/users/:id', authMiddleware, (req, res) => userController.getUser(req, res));
    router.delete('/users/:id', authMiddleware, (req, res) => userController.deleteUser(req, res));
    
    // Route admin seulement
    if (roleMiddleware) {
      router.get('/users', authMiddleware, roleMiddleware.requireRole('ADMIN'), (req, res) => userController.getAllUsers(req, res));
    } else {
      router.get('/users', authMiddleware, (req, res) => userController.getAllUsers(req, res));
    }
  } else {
    // Fallback sans authentification (pour les tests)
    router.post('/users', (req, res) => userController.createUser(req, res));
    router.get('/users/:id', (req, res) => userController.getUser(req, res));
    router.get('/users', (req, res) => userController.getAllUsers(req, res));
    router.delete('/users/:id', (req, res) => userController.deleteUser(req, res));
  }

  // Route de santé (toujours publique)
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV 
    });
  });

  return router;
}

module.exports = createRoutes;