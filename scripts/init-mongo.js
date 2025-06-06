// Script d'initialisation MongoDB
db = db.getSiblingDB('hexagonal_app');

// Créer un utilisateur pour l'application
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'hexagonal_app'
    }
  ]
});

// Créer les collections avec des index
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });

// Créer la base de test
db = db.getSiblingDB('hexagonal_app_test');
db.createUser({
  user: 'test_user',
  pwd: 'test_password',
  roles: [
    {
      role: 'readWrite',
      db: 'hexagonal_app_test'
    }
  ]
});

db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });

print('Bases de données initialisées avec succès!');