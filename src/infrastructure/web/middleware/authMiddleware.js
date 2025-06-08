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

            const token = authHeader.substring(7); // Remove 'Bearer '

            const result = await authService.getUserFromToken(token);

            req.user = result.user;
            req.auth = result.auth;

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