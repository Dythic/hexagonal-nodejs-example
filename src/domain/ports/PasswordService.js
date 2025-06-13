class PasswordService {
  async hash(password) {
    throw new Error("Méthode hash doit être implémentée");
  }

  async compare(password, hashedPassword) {
    throw new Error("Méthode compare doit être implémentée");
  }
}

module.exports = PasswordService;
