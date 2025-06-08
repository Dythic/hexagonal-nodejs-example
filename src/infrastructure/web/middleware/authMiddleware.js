const Auth = require('../../../domain/entities/Auth');

function createAuthMiddleware(authService) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token d\'authentification requis'
        });
      }

      const token = authHeader.substring(7);
      
      const result = await authService.getUserFromToken(token);
      
      req.user = result.user;
      
      const authData = result.auth;
      req.auth = new Auth(
        authData.userId, 
        authData.email, 
        authData.hashedPassword, 
        authData.role, 
        authData.isActive, 
        authData.createdAt
      );
      req.auth.lastLoginAt = authData.lastLoginAt;
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
    }
  };
}

module.exports = createAuthMiddleware;