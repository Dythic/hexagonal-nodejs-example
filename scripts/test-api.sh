#!/bin/bash

API_URL="http://localhost:3000/api"

echo "🧪 Test de l'API Hexagonale..."

echo "📊 Health check..."
curl -s "$API_URL/health" | jq '.'

echo -e "\n👤 Création d'un utilisateur..."
USER_RESPONSE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }')

echo "$USER_RESPONSE" | jq '.'

USER_ID=$(echo "$USER_RESPONSE" | jq -r '.data.id')

if [ "$USER_ID" != "null" ] && [ "$USER_ID" != "" ]; then
  echo -e "\n📋 Liste des utilisateurs..."
  curl -s "$API_URL/users" | jq '.'
  
  echo -e "\n🔍 Récupération de l'utilisateur $USER_ID..."
  curl -s "$API_URL/users/$USER_ID" | jq '.'
  
  echo -e "\n