class RefreshTokenRepository {
  async save(refreshToken) {
    throw new Error("Méthode save doit être implémentée");
  }

  async findByToken(token) {
    throw new Error("Méthode findByToken doit être implémentée");
  }

  async deleteByUserId(userId) {
    throw new Error("Méthode deleteByUserId doit être implémentée");
  }

  async deleteExpiredTokens() {
    throw new Error("Méthode deleteExpiredTokens doit être implémentée");
  }
}

module.exports = RefreshTokenRepository;
