class RefreshToken {
    constructor(id, userId, token, expiresAt, createdAt = new Date()) {
        this.id = id;
        this.userId = userId;
        this.token = token;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.isRevoked = false;
    }

    static create(userId, token, expiresAt) {
        if (!userId || !token || !expiresAt) {
            throw new Error('UserId, token et date d\'expiration sont requis');
        }

        return new RefreshToken(null, userId, token, expiresAt);
    }

    isExpired() {
        return new Date() > this.expiresAt;
    }

    revoke() {
        this.isRevoked = true;
    }

    isValid() {
        return !this.isRevoked && !this.isExpired();
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            expiresAt: this.expiresAt,
            createdAt: this.createdAt,
            isRevoked: this.isRevoked
        };
    }
}

module.exports = RefreshToken;