class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async register(req, res) {
        try {
            const { email, name, password, role } = req.body;

            if (!email || !name || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email, nom et mot de passe sont requis'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Le mot de passe doit contenir au moins 6 caractères'
                });
            }

            const result = await this.authService.register(email, name, password, role);

            res.status(201).json({
                success: true,
                message: 'Utilisateur créé avec succès',
                data: {
                    user: result.user
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email et mot de passe sont requis'
                });
            }

            const result = await this.authService.login(email, password);

            res.json({
                success: true,
                message: 'Connexion réussie',
                data: {
                    user: result.user,
                    tokens: result.tokens
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Refresh token requis'
                });
            }

            const tokens = await this.authService.refreshToken(refreshToken);

            res.json({
                success: true,
                data: { tokens }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    }

    async logout(req, res) {
        try {
            await this.authService.logout(req.user.userId);

            res.json({
                success: true,
                message: 'Déconnexion réussie'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Mot de passe actuel et nouveau mot de passe requis'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
                });
            }

            await this.authService.changePassword(req.user.userId, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Mot de passe modifié avec succès'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getProfile(req, res) {
        try {
            res.json({
                success: true,
                data: {
                    user: req.user
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = AuthController;