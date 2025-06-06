const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MongoUserRepository = require('../../../src/infrastructure/database/MongoUserRepository');
const User = require('../../../src/domain/entities/User');

describe('MongoUserRepository', () => {
  let mongoServer;
  let mongoClient;
  let repository;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    
    db = mongoClient.db('test');
    repository = new MongoUserRepository(mongoClient, 'test');
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await db.collection('users').deleteMany({});
  });

  describe('save', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      const user = User.create('test@example.com', 'John Doe');
      
      const savedUser = await repository.save(user);
      
      expect(savedUser.id).toBeDefined();
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.name).toBe('John Doe');
      
      // Vérifier en base
      const doc = await db.collection('users').findOne({ _id: new ObjectId(savedUser.id) });
      expect(doc.email).toBe('test@example.com');
    });

    it('devrait mettre à jour un utilisateur existant', async () => {
      // Créer d'abord un utilisateur
      const user = User.create('test@example.com', 'John Doe');
      const savedUser = await repository.save(user);
      
      // Modifier et sauvegarder
      savedUser.name = 'Jane Doe';
      const updatedUser = await repository.save(savedUser);
      
      expect(updatedUser.name).toBe('Jane Doe');
      
      // Vérifier en base
      const doc = await db.collection('users').findOne({ _id: new ObjectId(savedUser.id) });
      expect(doc.name).toBe('Jane Doe');
    });

    it('devrait rejeter la mise à jour d\'un utilisateur inexistant', async () => {
      const user = new User(new ObjectId().toString(), 'test@example.com', 'John Doe');
      
      await expect(repository.save(user))
        .rejects.toThrow('Utilisateur non trouvé pour la mise à jour');
    });
  });

  describe('findById', () => {
    it('devrait trouver un utilisateur par son ID', async () => {
      const user = User.create('test@example.com', 'John Doe');
      const savedUser = await repository.save(user);
      
      const foundUser = await repository.findById(savedUser.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('test@example.com');
      expect(foundUser.name).toBe('John Doe');
    });

    it('devrait retourner null pour un ID inexistant', async () => {
      const result = await repository.findById(new ObjectId().toString());
      expect(result).toBeNull();
    });

    it('devrait retourner null pour un ID invalide', async () => {
      const result = await repository.findById('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('devrait trouver un utilisateur par son email', async () => {
      const user = User.create('test@example.com', 'John Doe');
      await repository.save(user);
      
      const foundUser = await repository.findByEmail('test@example.com');
      
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('test@example.com');
    });

    it('devrait être insensible à la casse', async () => {
      const user = User.create('test@example.com', 'John Doe');
      await repository.save(user);
      
      const foundUser = await repository.findByEmail('TEST@EXAMPLE.COM');
      
      expect(foundUser).toBeDefined();
    });

    it('devrait retourner null pour un email inexistant', async () => {
      const result = await repository.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('devrait retourner tous les utilisateurs', async () => {
      const user1 = User.create('user1@example.com', 'User 1');
      const user2 = User.create('user2@example.com', 'User 2');
      
      await repository.save(user1);
      await repository.save(user2);
      
      const users = await repository.findAll();
      
      expect(users).toHaveLength(2);
      expect(users.map(u => u.email)).toContain('user1@example.com');
      expect(users.map(u => u.email)).toContain('user2@example.com');
    });

    it('devrait retourner un tableau vide s\'il n\'y a pas d\'utilisateurs', async () => {
      const users = await repository.findAll();
      expect(users).toEqual([]);
    });
  });

  describe('delete', () => {
    it('devrait supprimer un utilisateur existant', async () => {
      const user = User.create('test@example.com', 'John Doe');
      const savedUser = await repository.save(user);
      
      await repository.delete(savedUser.id);
      
      const foundUser = await repository.findById(savedUser.id);
      expect(foundUser).toBeNull();
    });

    it('devrait rejeter la suppression d\'un utilisateur inexistant', async () => {
      await expect(repository.delete(new ObjectId().toString()))
        .rejects.toThrow('Utilisateur non trouvé pour la suppression');
    });

    it('devrait rejeter un ID invalide', async () => {
      await expect(repository.delete('invalid-id'))
        .rejects.toThrow('ID invalide');
    });
  });
});