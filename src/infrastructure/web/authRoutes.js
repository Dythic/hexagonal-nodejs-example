// src/infrastructure/web/authRoutes.js - Version améliorée
const express = require('express');

function createAuthRoutes(authController, authMiddleware) {
    const router = express.Router();

    // Routes publiques
    router.post('/register', (req, res) => authController.register(req, res));
    router.post('/login', (req, res) => authController.login(req, res));
    router.post('/refresh-token', (req, res) => authController.refreshToken(req, res));

    // Routes protégées
    router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));
    router.get('/profile', authMiddleware, (req, res) => authController.getProfile(req, res));
    
    // 🔧 NOUVEAU : Route avec ID utilisateur explicite
    router.post('/users/:userId/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));
    
    // 🔧 ALTERNATIVE : Garder l'ancienne route pour compatibilité
    router.post('/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));

    return router;
}

module.exports = createAuthRoutes;