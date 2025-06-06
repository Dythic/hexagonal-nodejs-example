FROM node:18-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Changer le propriétaire des fichiers
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]