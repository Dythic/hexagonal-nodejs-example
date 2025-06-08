### 10.2 Créer un script de test

Crée `scripts/test-auth.sh` :

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"

echo "🔐 Test de l'authentification..."

# Inscription
echo "📝 Inscription..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Connexion
echo -e "\n🔑 Connexion..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extraire le token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')

if [ "$ACCESS_TOKEN" != "null" ] && [ "$ACCESS_TOKEN" != "" ]; then
  echo -e "\n👤 Profil utilisateur..."
  curl -s "$API_URL/auth/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    
  echo -e "\n📋 Liste des utilisateurs (route protégée)..."
  curl -s "$API_URL/users" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
else
  echo "❌ Échec de la connexion"
fi