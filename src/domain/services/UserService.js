const User = require('../entities/User');

class UserService {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async createUser(email, name) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Créer le nouvel utilisateur
    const user = User.create(email, name);
    
    // Sauvegarder
    const savedUser = await this.userRepository.save(user);
    
    // Envoyer email de bienvenue (ne pas faire échouer si l'email échoue)
    try {
      await this.emailService.sendWelcomeEmail(savedUser);
    } catch (error) {
      console.warn('Échec envoi email de bienvenue:', error.message);
    }
    
    return savedUser;
  }

  async getUserById(id) {
    if (!id) {
      throw new Error('ID utilisateur requis');
    }
    
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    return user;
  }

  async getAllUsers() {
    return await this.userRepository.findAll();
  }

  async deleteUser(id) {
    const user = await this.getUserById(id); // Vérifier que l'utilisateur existe
    await this.userRepository.delete(id);
    return user;
  }
}

module.exports = UserService;