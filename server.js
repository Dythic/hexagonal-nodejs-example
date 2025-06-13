require("dotenv").config();
const createApp = require("./app");

const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_DB_NAME,
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
};

async function startServer() {
  try {
    const { app, mongoClient } = await createApp(config);

    const server = app.listen(config.port, () => {
      console.log(`🚀 Serveur démarré sur le port ${config.port}`);
      console.log(`📊 Mongo Express: http://localhost:8081`);
      console.log(
        `🏥 Health check: http://localhost:${config.port}/api/health`,
      );
    });

    process.on("SIGTERM", async () => {
      console.log("🛑 Arrêt du serveur...");
      server.close(async () => {
        await mongoClient.close();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Erreur au démarrage:", error);
    process.exit(1);
  }
}

startServer();
