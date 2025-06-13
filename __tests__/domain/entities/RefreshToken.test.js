const RefreshToken = require('../../../src/domain/entities/RefreshToken');

describe('RefreshToken Entity', () => {
    const validUserId = 'user123';
    const validToken = 'refresh-token-abc123';
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h dans le futur
    const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1h dans le passé

    describe('constructor', () => {
        it('devrait créer une instance RefreshToken', () => {
            const refreshToken = new RefreshToken('id123', validUserId, validToken, futureDate);

            expect(refreshToken.id).toBe('id123');
            expect(refreshToken.userId).toBe(validUserId);
            expect(refreshToken.token).toBe(validToken);
            expect(refreshToken.expiresAt).toBe(futureDate);
            expect(refreshToken.createdAt).toBeInstanceOf(Date);
            expect(refreshToken.isRevoked).toBe(false);
        });

        it('devrait utiliser la date actuelle comme createdAt par défaut', () => {
            const refreshToken = new RefreshToken('id123', validUserId, validToken, futureDate);

            expect(refreshToken.createdAt.getTime()).toBeCloseTo(Date.now(), -2);
        });

        it('devrait accepter une date createdAt personnalisée', () => {
            const customDate = new Date('2024-01-01');
            const refreshToken = new RefreshToken('id123', validUserId, validToken, futureDate, customDate);

            expect(refreshToken.createdAt).toBe(customDate);
        });
    });

    describe('create', () => {
        it('devrait créer un RefreshToken sans ID', () => {
            const refreshToken = RefreshToken.create(validUserId, validToken, futureDate);

            expect(refreshToken.id).toBeNull();
            expect(refreshToken.userId).toBe(validUserId);
            expect(refreshToken.token).toBe(validToken);
            expect(refreshToken.expiresAt).toBe(futureDate);
        });

        it('devrait rejeter un userId manquant', () => {
            expect(() => RefreshToken.create('', validToken, futureDate))
                .toThrow('UserId, token et date d\'expiration sont requis');
            expect(() => RefreshToken.create(null, validToken, futureDate))
                .toThrow('UserId, token et date d\'expiration sont requis');
        });

        it('devrait rejeter un token manquant', () => {
            expect(() => RefreshToken.create(validUserId, '', futureDate))
                .toThrow('UserId, token et date d\'expiration sont requis');
            expect(() => RefreshToken.create(validUserId, null, futureDate))
                .toThrow('UserId, token et date d\'expiration sont requis');
        });

        it('devrait rejeter une date d\'expiration manquante', () => {
            expect(() => RefreshToken.create(validUserId, validToken, null))
                .toThrow('UserId, token et date d\'expiration sont requis');
            expect(() => RefreshToken.create(validUserId, validToken, undefined))
                .toThrow('UserId, token et date d\'expiration sont requis');
        });
    });

    describe('isExpired', () => {
        it('devrait retourner false pour un token valide', () => {
            const refreshToken = RefreshToken.create(validUserId, validToken, futureDate);

            expect(refreshToken.isExpired()).toBe(false);
        });

        it('devrait retourner true pour un token expiré', () => {
            const refreshToken = RefreshToken.create(validUserId, validToken, pastDate);

            expect(refreshToken.isExpired()).toBe(true);
        });

        it('devrait retourner true pour un token expirant exactement maintenant', () => {
            const now = new Date();
            const refreshToken = RefreshToken.create(validUserId, validToken, now);

            // Petit délai pour s'assurer que le token est expiré
            setTimeout(() => {
                expect(refreshToken.isExpired()).toBe(true);
            }, 1);
        });
    });

    describe('revoke', () => {
        it('devrait révoquer un token', () => {
            const refreshToken = RefreshToken.create(validUserId, validToken, futureDate);
            expect(refreshToken.isRevoked).toBe(false);

            refreshToken.revoke();
            expect(refreshToken.isRevoked).toBe(true);
        });
    });

    describe('isValid', () => {
        it('devrait retourner true pour un token valide et non révoqué', () => {
            const refreshToken = RefreshToken.create(validUserId, validToken, futureDate);

            expect(refreshToken.isValid()).toBe(true);
        });

        it('devrait retourner false pour un token révoqué', () => {
            const refreshToken = RefreshToken.create(validUserId, validToken, futureDate);
            refreshToken.revoke();

            expect(refreshToken.isValid()).toBe(false);
        });

        it('devrait retourner false pour un token expiré', () => {
            const refreshToken = RefreshToken.create(validUserId, validToken, pastDate);

            expect(refreshToken.isValid()).toBe(false);
        });

        it('devrait retourner false pour un token expiré ET révoqué', () => {
            const refreshToken = RefreshToken.create(validUserId, validToken, pastDate);
            refreshToken.revoke();

            expect(refreshToken.isValid()).toBe(false);
        });
    });

    describe('toJSON', () => {
        it('devrait sérialiser sans exposer le token', () => {
            const refreshToken = RefreshToken.create(validUserId, validToken, futureDate);
            refreshToken.id = 'generated-id';

            const json = refreshToken.toJSON();

            expect(json).toEqual({
                id: 'generated-id',
                userId: validUserId,
                expiresAt: futureDate,
                createdAt: refresh,
            })
        });
    });
});
