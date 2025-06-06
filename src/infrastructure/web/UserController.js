class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  async createUser(req, res) {
    try {
      const { email, name } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ 
          success: false,
          error: 'Email et nom sont requis' 
        });
      }
      
      const user = await this.userService.createUser(email, name);
      
      res.status(201).json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      
      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      const statusCode = error.message === 'Utilisateur non trouvé' ? 404 : 400;
      res.status(statusCode).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await this.userService.getAllUsers();
      
      res.json({
        success: true,
        data: users.map(user => user.toJSON())
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deletedUser = await this.userService.deleteUser(id);
      
      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès',
        data: deletedUser.toJSON()
      });
    } catch (error) {
      const statusCode = error.message === 'Utilisateur non trouvé' ? 404 : 400;
      res.status(statusCode).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

module.exports = UserController;