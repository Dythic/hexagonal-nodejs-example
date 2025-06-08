class Auth {
    constructor(userId, email, hashedPassword, role = 'USER', isActive = true, createdAt = new Date()) {
        this.userId = userId;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.role = role; // USER, ADMIN
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.lastLoginAt = null;
    }

    static create(userId, email, hashedPassword, role = 'USER') {
        if (!userId || !email || !hashedPassword) {
            throw new Error('UserId, email et mot de passe hashé sont requis');
        }

        if (!['USER', 'ADMIN'].includes(role)) {
            throw new Error('Rôle invalide');
        }

        return new Auth(userId, email, hashedPassword, role);
    }

    updateLastLogin() {
        this.lastLoginAt = new Date();
    }

    deactivate() {
        this.isActive = false;
    }

    activate() {
        this.isActive = true;
    }

    hasRole(requiredRole) {
        const roleHierarchy = { ADMIN: 2, USER: 1 };
        return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
    }

    toJSON() {
        return {
            userId: this.userId,
            email: this.email,
            role: this.role,
            isActive: this.isActive,
            createdAt: this.createdAt,
            lastLoginAt: this.lastLoginAt
        };
    }
}

module.exports = Auth;