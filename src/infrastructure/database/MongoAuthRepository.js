const AuthRepository = require("../../domain/ports/AuthRepository");
const Auth = require("../../domain/entities/Auth");

class MongoAuthRepository extends AuthRepository {
  constructor(mongoClient, dbName) {
    super();
    this.collection = mongoClient.db(dbName).collection("auth");
  }

  async save(auth) {
    if (auth.userId && (await this.findByUserId(auth.userId))) {
      const result = await this.collection.updateOne(
        { userId: auth.userId },
        {
          $set: {
            email: auth.email,
            hashedPassword: auth.hashedPassword,
            role: auth.role,
            isActive: auth.isActive,
            lastLoginAt: auth.lastLoginAt,
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new Error("Auth non trouvé pour la mise à jour");
      }

      return auth;
    } else {
      const doc = {
        userId: auth.userId,
        email: auth.email,
        hashedPassword: auth.hashedPassword,
        role: auth.role,
        isActive: auth.isActive,
        createdAt: auth.createdAt,
        lastLoginAt: auth.lastLoginAt,
        updatedAt: new Date(),
      };

      await this.collection.insertOne(doc);
      return auth;
    }
  }

  async findByEmail(email) {
    const doc = await this.collection.findOne({ email: email.toLowerCase() });
    if (!doc) return null;

    const auth = new Auth(
      doc.userId,
      doc.email,
      doc.hashedPassword,
      doc.role,
      doc.isActive,
      doc.createdAt,
    );
    auth.lastLoginAt = doc.lastLoginAt;
    return auth;
  }

  async findByUserId(userId) {
    const doc = await this.collection.findOne({ userId });
    if (!doc) return null;

    const auth = new Auth(
      doc.userId,
      doc.email,
      doc.hashedPassword,
      doc.role,
      doc.isActive,
      doc.createdAt,
    );
    auth.lastLoginAt = doc.lastLoginAt;
    return auth;
  }

  async updateLastLogin(userId) {
    await this.collection.updateOne(
      { userId },
      {
        $set: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
  }

  async deactivateUser(userId) {
    await this.collection.updateOne(
      { userId },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      },
    );
  }
}

module.exports = MongoAuthRepository;
