class UserRepository {
  async save(user) {
    throw new Error('Méthode save doit être implémentée');
  }

  async findById(id) {
    throw new Error('Méthode findById doit être implémentée');
  }

  async findByEmail(email) {
    throw new Error('Méthode findByEmail doit être implémentée');
  }

  async findAll() {
    throw new Error('Méthode findAll doit être implémentée');
  }

  async delete(id) {
    throw new Error('Méthode delete doit être implémentée');
  }
}

module.exports = UserRepository;
