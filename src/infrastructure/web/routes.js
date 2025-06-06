const express = require('express');

function createRoutes(userController) {
  const router = express.Router();

  // Routes utilisateurs
  router.post('/users', (req, res) => userController.createUser(req, res));
  router.get('/users/:id', (req, res) => userController.getUser(req, res));
  router.get('/users', (req, res) => userController.getAllUsers(req, res));
  router.delete('/users/:id', (req, res) => userController.deleteUser(req, res));

  // Route de santé
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