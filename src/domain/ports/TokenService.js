class TokenService {
    generateAccessToken(payload) {
        throw new Error('Méthode generateAccessToken doit être implémentée');
    }

    generateRefreshToken(payload) {
        throw new Error('Méthode generateRefreshToken doit être implémentée');
    }

    verifyAccessToken(token) {
        throw new Error('Méthode verifyAccessToken doit être implémentée');
    }

    verifyRefreshToken(token) {
        throw new Error('Méthode verifyRefreshToken doit être implémentée');
    }

    decodeToken(token) {
        throw new Error('Méthode decodeToken doit être implémentée');
    }
}

module.exports = TokenService;