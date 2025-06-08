const bcrypt = require('bcryptjs');
const PasswordService = require('../../domain/ports/PasswordService');

class BcryptPasswordService extends PasswordService {
    constructor() {
        super();
        this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    }

    async hash(password) {
        if (!password || password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }

        return await bcrypt.hash(password, this.saltRounds);
    }

    async compare(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = BcryptPasswordService;