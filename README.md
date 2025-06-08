# 🏗️ Architecture Hexagonale avec Node.js

Un exemple complet d'implémentation de l'architecture hexagonale (Ports & Adapters) avec Node.js, Express, MongoDB et des tests complets.

## 🚀 Démarrage rapide

```bash
# 1. Cloner et installer
git clone <votre-repo>
cd hexagonal-nodejs-app
npm install

# 2. Démarrer MongoDB avec Docker
npm run docker:up

# 3. Configurer l'environnement
cp .env.example .env

# 4. Lancer l'application
npm run dev
```

L'API sera disponible sur http://localhost:3000

## 📁 Structure du projet

```
src/
├── domain/              # 🎯 Cœur métier (logique pure)
│   ├── entities/        # Entités métier
│   ├── ports/          # Interfaces (contrats)
│   └── services/       # Services métier
└── infrastructure/     # 🔌 Adaptateurs externes
    ├── database/       # Persistance MongoDB
    ├── email/         # Service d'email
    └── web/           # API REST
```

## 🛠️ Commandes utiles

```bash
# Développement
npm run dev              # Démarrer avec rechargement auto
npm start               # Démarrer en production

# Tests
npm test                # Tous les tests
npm run test:watch      # Tests en mode watch
npm run test:coverage   # Couverture de code

# Docker
npm run docker:up       # Démarrer MongoDB
npm run docker:down     # Arrêter les services
```

## 📡 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/users` | Créer un utilisateur |
| `GET` | `/api/users` | Lister les utilisateurs |
| `GET` | `/api/users/:id` | Récupérer un utilisateur |
| `DELETE` | `/api/users/:id` | Supprimer un utilisateur |
| `GET` | `/api/health` | Statut de l'API |

## 🧪 Exemples d'utilisation

### Créer un utilisateur
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "name": "John Doe"}'
```

### Lister les utilisateurs
```bash
curl http://localhost:3000/api/users
```

## 🧪 Tests

Le projet inclut trois types de tests :

- **Tests unitaires** : Entités, services avec mocks
- **Tests d'intégration** : Base de données en mémoire
- **Tests API** : Tests end-to-end complets

```bash
# Tests par catégorie
npm test -- --testPathPattern="entities"      # Tests des entités
npm test -- --testPathPattern="services"     # Tests des services
npm test -- --testPathPattern="integration"  # Tests d'intégration
```

## 🏗️ Architecture Hexagonale

### Avantages
- ✅ **Logique métier isolée** des détails techniques
- ✅ **Facilement testable** avec des mocks
- ✅ **Flexible** : changer de base/framework sans impact
- ✅ **Maintenable** : séparation claire des responsabilités

### Couches
1. **Domain** : Logique métier pure (centre de l'hexagone)
2. **Ports** : Interfaces définissant les contrats
3. **Adapters** : Implémentations concrètes (base, web, email...)

## 🛢️ Base de données

MongoDB via Docker avec Mongo Express pour l'interface web :
- **MongoDB** : `mongodb://localhost:27017`
- **Mongo Express** : http://localhost:8081

## 📧 Configuration Email

Pour les emails, configurez un service SMTP dans `.env` :
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_user
EMAIL_PASS=your_password
```

## 🐳 Docker

Le projet utilise Docker Compose pour MongoDB :
```yaml
# docker-compose.yml inclut :
- MongoDB avec authentification
- Mongo Express (interface web)
- Volumes persistants
- Réseau dédié
```

## 🔧 Technologies

- **Node.js** + **Express** - API REST
- **MongoDB** - Base de données NoSQL
- **Jest** - Framework de tests
- **Docker** - Conteneurisation
- **Nodemailer** - Service d'email

## 📚 Prochaines étapes

- [x] Authentification JWT
- [ ] Validation avec Joi/Yup
- [ ] Logging avec Winston
- [ ] Rate limiting
- [ ] Documentation Swagger

---

💡 **Architecture hexagonale** = Logique métier au centre, tout le reste à la périphérie !

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Endpoints d'authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/refresh-token` | Renouveler le token |
| POST | `/api/auth/logout` | Déconnexion |
| POST | `/api/auth/change-password` | Changer mot de passe |
| GET | `/api/auth/profile` | Profil utilisateur |

### Exemples d'utilisation

#### Inscription
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "password123"
  }'