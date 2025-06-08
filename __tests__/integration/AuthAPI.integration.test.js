const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const createApp = require('../../app');

describe('Auth API Integration Tests', () => {
    let app;
    let mongoServer;
    let mongoClient;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        const config = {
            mongoUri: uri,
            dbName: 'auth_test',
            email: {
                host: 'localhost',
                port: 587,
                user: 'test',
                pass: 'test',
                from: 'test@example.com'
            }
        };

        class MockEmailService {
            async sendWelcomeEmail(user) {
                return Promise.resolve();
            }
        }

        const appData = await createApp(config, new MockEmailService());
        app = appData.app;
        mongoClient = appData.mongoClient;
    });

    afterAll(async () => {
        await mongoClient.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        const db = mongoClient.db('auth_test');
        await db.collection('users').deleteMany({});
        await db.collection('auth').deleteMany({});
        await db.collection('refresh_tokens').deleteMany({});
    });

    describe('POST /api/auth/register', () => {
        it('devrait créer un utilisateur avec succès', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'John Doe',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.name).toBe(userData.name);
        });

        it('devrait rejeter un mot de passe trop court', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'John Doe',
                password: '123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('6 caractères');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Créer un utilisateur test
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    name: 'John Doe',
                    password: 'password123'
                });
        });

        it('devrait connecter l\'utilisateur avec succès', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.tokens.accessToken).toBeDefined();
            expect(response.body.data.tokens.refreshToken).toBeDefined();
        });

        it('devrait rejeter un mauvais mot de passe', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Routes protégées', () => {
        let accessToken;

        beforeEach(async () => {
            // Créer et connecter un utilisateur
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    name: 'John Doe',
                    password: 'password123'
                });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            accessToken = loginResponse.body.data.tokens.accessToken;
        });

        it('devrait accéder au profil avec un token valide', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
        });

        it('devrait rejeter l\'accès sans token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('devrait permettre de changer le mot de passe', async () => {
            const response = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'newpassword123'
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Tester la connexion avec le nouveau mot de passe
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'newpassword123'
                })
                .expect(200);

            expect(loginResponse.body.success).toBe(true);
        });
    });
});