class User {
  constructor(id, email, name, createdAt = new Date()) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = createdAt;
    this.updatedAt = new Date();
  }

  isValidEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  static create(email, name) {
    if (!email || !name) {
      throw new Error('Email et nom sont requis');
    }
    
    const user = new User(null, email.toLowerCase().trim(), name.trim());
    
    if (!user.isValidEmail()) {
      throw new Error('Format d\'email invalide');
    }
    
    if (name.length < 2) {
      throw new Error('Le nom doit contenir au moins 2 caractères');
    }
    
    return user;
  }

  updateProfile(name) {
    if (name && name.length >= 2) {
      this.name = name.trim();
      this.updatedAt = new Date();
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;