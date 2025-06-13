class AuthRepository {
  async save(auth) {
    throw new Error("Méthode save doit être implémentée");
  }

  async findByEmail(email) {
    throw new Error("Méthode findByEmail doit être implémentée");
  }

  async findByUserId(userId) {
    throw new Error("Méthode findByUserId doit être implémentée");
  }

  async updateLastLogin(userId) {
    throw new Error("Méthode updateLastLogin doit être implémentée");
  }

  async deactivateUser(userId) {
    throw new Error("Méthode deactivateUser doit être implémentée");
  }
}

module.exports = AuthRepository;
