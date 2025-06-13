const UserRepository = require("../../domain/ports/UserRepository");
const User = require("../../domain/entities/User");
const { ObjectId } = require("mongodb");

class MongoUserRepository extends UserRepository {
  constructor(mongoClient, dbName) {
    super();
    this.collection = mongoClient.db(dbName).collection("users");
  }

  async save(user) {
    if (user.id) {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(user.id) },
        {
          $set: {
            email: user.email,
            name: user.name,
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new Error("Utilisateur non trouvé pour la mise à jour");
      }

      return user;
    } else {
      const doc = {
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: new Date(),
      };

      const result = await this.collection.insertOne(doc);
      return new User(
        result.insertedId.toString(),
        user.email,
        user.name,
        user.createdAt,
      );
    }
  }

  async findById(id) {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;

    return new User(doc._id.toString(), doc.email, doc.name, doc.createdAt);
  }

  async findByEmail(email) {
    const doc = await this.collection.findOne({ email: email.toLowerCase() });
    if (!doc) return null;

    return new User(doc._id.toString(), doc.email, doc.name, doc.createdAt);
  }

  async findAll() {
    const docs = await this.collection.find({}).toArray();
    return docs.map(
      (doc) => new User(doc._id.toString(), doc.email, doc.name, doc.createdAt),
    );
  }

  async delete(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error("ID invalide");
    }

    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      throw new Error("Utilisateur non trouvé pour la suppression");
    }
  }
}

module.exports = MongoUserRepository;
