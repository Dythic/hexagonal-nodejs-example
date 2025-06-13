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
          error: "Email, nom et mot de passe sont requis",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Le mot de passe doit contenir au moins 6 caractères",
        });
      }

      const result = await this.authService.register(
        email,
        name,
        password,
        role,
      );

      res.status(201).json({
        success: true,
        message: "Utilisateur créé avec succès",
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Email et mot de passe sont requis",
        });
      }

      const result = await this.authService.login(email, password);

      res.json({
        success: true,
        message: "Connexion réussie",
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: "Refresh token requis",
        });
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: { tokens },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  async logout(req, res) {
    try {
      await this.authService.logout(req.user.userId);

      res.json({
        success: true,
        message: "Déconnexion réussie",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const { userId } = req.params; // ID depuis l'URL

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Mot de passe actuel et nouveau mot de passe requis",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        });
      }

      // 🔐 SÉCURITÉ : Vérifier que l'utilisateur ne peut changer que son propre mot de passe
      if (userId && userId !== req.user.id) {
        // Sauf si c'est un admin qui veut changer le mot de passe d'un autre utilisateur
        if (!req.auth.hasRole("ADMIN")) {
          return res.status(403).json({
            success: false,
            error: "Vous ne pouvez changer que votre propre mot de passe",
          });
        }
      }

      // Utiliser l'ID depuis l'URL ou celui du token
      const targetUserId = userId || req.user.id;

      await this.authService.changePassword(
        targetUserId,
        currentPassword,
        newPassword,
      );

      res.json({
        success: true,
        message: "Mot de passe modifié avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // 🆕 BONUS : Méthode pour qu'un admin change le mot de passe d'un utilisateur
  async adminChangePassword(req, res) {
    try {
      const { newPassword } = req.body;
      const { userId } = req.params;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: "Nouveau mot de passe requis",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        });
      }

      // Vérifier que c'est un admin
      if (!req.auth.hasRole("ADMIN")) {
        return res.status(403).json({
          success: false,
          error: "Seuls les administrateurs peuvent effectuer cette action",
        });
      }

      await this.authService.adminChangePassword(userId, newPassword);

      res.json({
        success: true,
        message: "Mot de passe administrateur modifié avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = AuthController;
