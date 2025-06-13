db = db.getSiblingDB("hexagonal_app");

db.createUser({
  user: "app_user",
  pwd: "app_password",
  roles: [
    {
      role: "readWrite",
      db: "hexagonal_app",
    },
  ],
});

db.createCollection("users");
db.users.createIndex({ email: 1 }, { unique: true });

db = db.getSiblingDB("hexagonal_app_test");
db.createUser({
  user: "test_user",
  pwd: "test_password",
  roles: [
    {
      role: "readWrite",
      db: "hexagonal_app_test",
    },
  ],
});

db.createCollection("users");
db.users.createIndex({ email: 1 }, { unique: true });

print("Bases de données initialisées avec succès!");
