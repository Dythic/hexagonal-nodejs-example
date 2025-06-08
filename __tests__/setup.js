// Configuration globale pour les tests
beforeAll(async () => {
    // Configuration globale avant tous les tests
  });
  
  afterAll(async () => {
    // Nettoyage global après tous les tests
  });
  
  // Supprimer les warnings de deprecation pour les tests
  process.env.NODE_NO_WARNINGS = '1';
  
  // Configuration Jest pour les tests d'intégration
  jest.setTimeout(30000);