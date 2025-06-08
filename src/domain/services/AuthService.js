const Auth = require('../entities/Auth');
const RefreshToken = require('../entities/RefreshToken');
const crypto = require('crypto');

class AuthService {
    constructor(authRepository, refreshTokenRepository, userRepository, passwordService, tokenService) {
        this.authRepository = authRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
    }

    async register(email, name, password, role = 'USER') {
        const existingAuth = await this.authRepository.findByEmail(email);
        if (existingAuth) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }

        const user = await this.userRepository.save(
            require('../entities/User').create(email, name)
        );

        const hashedPassword = await this.passwordService.hash(password);

        const auth = Auth.create(user.id, email, hashedPassword, role);
        await this.authRepository.save(auth);

        return {
            user: user.toJSON(),
            auth: auth.toJSON()
        };
    }

    async login(email, password) {
        const auth = await this.authRepository.findByEmail(email);
        if (!auth) {
            throw new Error('Email ou mot de passe incorrect');
        }

        if (!auth.isActive) {
            throw new Error('Compte désactivé');
        }

        const isPasswordValid = await this.passwordService.compare(password, auth.hashedPassword);
        if (!isPasswordValid) {
            throw new Error('Email ou mot de passe incorrect');
        }

        const user = await this.userRepository.findById(auth.userId);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        await this.authRepository.updateLastLogin(auth.userId);

        const tokens = await this.generateTokens(auth);

        return {
            user: user.toJSON(),
            tokens
        };
    }

    async generateTokens(auth) {
        const payload = {
            userId: auth.userId,
            email: auth.email,
            role: auth.role
        };

        const accessToken = this.tokenService.generateAccessToken(payload);

        const refreshTokenValue = crypto.randomBytes(32).toString('hex');
        const refreshToken = this.tokenService.generateRefreshToken({
            userId: auth.userId,
            tokenId: refreshTokenValue
        });

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const refreshTokenEntity = RefreshToken.create(auth.userId, refreshTokenValue, expiresAt);
        await this.refreshTokenRepository.save(refreshTokenEntity);

        return {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        };
    }

    async refreshToken(refreshToken) {
        try {
            const decoded = this.tokenService.verifyRefreshToken(refreshToken);

            const tokenEntity = await this.refreshTokenRepository.findByToken(decoded.tokenId);
            if (!tokenEntity || !tokenEntity.isValid()) {
                throw new Error('Refresh token invalide');
            }

            const auth = await this.authRepository.findByUserId(tokenEntity.userId);
            if (!auth || !auth.isActive) {
                throw new Error('Utilisateur non trouvé ou désactivé');
            }

            await this.refreshTokenRepository.deleteByUserId(auth.userId);

            return await this.generateTokens(auth);

        } catch (error) {
            throw new Error('Refresh token invalide');
        }
    }

    async logout(userId) {
        await this.refreshTokenRepository.deleteByUserId(userId);
    }

    async changePassword(userId, currentPassword, newPassword) {
        const auth = await this.authRepository.findByUserId(userId);
        if (!auth) {
            throw new Error('Utilisateur non trouvé');
        }

        const isCurrentPasswordValid = await this.passwordService.compare(
            currentPassword,
            auth.hashedPassword
        );
        if (!isCurrentPasswordValid) {
            throw new Error('Mot de passe actuel incorrect');
        }

        const newHashedPassword = await this.passwordService.hash(newPassword);
        auth.hashedPassword = newHashedPassword;

        await this.authRepository.save(auth);

        await this.refreshTokenRepository.deleteByUserId(userId);
    }

    async getUserFromToken(token) {
        try {
            const decoded = this.tokenService.verifyAccessToken(token);

            const auth = await this.authRepository.findByUserId(decoded.userId);
            if (!auth || !auth.isActive) {
                throw new Error('Utilisateur non trouvé ou désactivé');
            }

            const user = await this.userRepository.findById(decoded.userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            return {
                user: user.toJSON(),
                auth: auth.toJSON()
            };
        } catch (error) {
            throw new Error('Token invalide');
        }
    }
}

module.exports = AuthService;