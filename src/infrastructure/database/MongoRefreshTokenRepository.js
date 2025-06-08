const RefreshTokenRepository = require('../../domain/ports/RefreshTokenRepository');
const RefreshToken = require('../../domain/entities/RefreshToken');
const { ObjectId } = require('mongodb');

class MongoRefreshTokenRepository extends RefreshTokenRepository {
    constructor(mongoClient, dbName) {
        super();
        this.collection = mongoClient.db(dbName).collection('refresh_tokens');
    }

    async save(refreshToken) {
        const doc = {
            userId: refreshToken.userId,
            token: refreshToken.token,
            expiresAt: refreshToken.expiresAt,
            createdAt: refreshToken.createdAt,
            isRevoked: refreshToken.isRevoked
        };

        const result = await this.collection.insertOne(doc);
        return new RefreshToken(result.insertedId.toString(), refreshToken.userId, refreshToken.token, refreshToken.expiresAt, refreshToken.createdAt);
    }

    async findByToken(token) {
        const doc = await this.collection.findOne({ token, isRevoked: false });
        if (!doc) return null;

        const refreshToken = new RefreshToken(doc._id.toString(), doc.userId, doc.token, doc.expiresAt, doc.createdAt);
        refreshToken.isRevoked = doc.isRevoked;
        return refreshToken;
    }

    async deleteByUserId(userId) {
        await this.collection.deleteMany({ userId });
    }

    async deleteExpiredTokens() {
        const now = new Date();
        await this.collection.deleteMany({
            $or: [
                { expiresAt: { $lt: now } },
                { isRevoked: true }
            ]
        });
    }
}

module.exports = MongoRefreshTokenRepository;