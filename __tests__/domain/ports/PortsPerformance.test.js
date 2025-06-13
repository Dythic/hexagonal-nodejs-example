// __tests__/domain/ports/PortsPerformance.test.js
describe('Tests de Performance des Ports', () => {
  describe('Vérification des appels de méthodes', () => {
    it('devrait mesurer le temps d\'exécution des méthodes des ports', async () => {
      const UserRepository = require('../../../src/domain/ports/UserRepository');
      
      const repo = new UserRepository();
      const startTime = Date.now();
      
      try {
        await repo.save({});
      } catch (error) {
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        // Vérifier que l'erreur est lancée rapidement (moins de 10ms)
        expect(executionTime).toBeLessThan(10);
        expect(error.message).toContain('doit être implémentée');
      }
    });
  });

  describe('Test de charge sur les ports', () => {
    it('devrait gérer de multiples appels simultanés', async () => {
      const EmailService = require('../../../src/domain/ports/EmailService');
      
      const emailService = new EmailService();
      const promises = [];
      
      // Créer 100 appels simultanés
      for (let i = 0; i < 100; i++) {
        promises.push(
          emailService.sendWelcomeEmail({ email: `test${i}@test.com` })
            .catch(error => error.message)
        );
      }
      
      const results = await Promise.all(promises);
      
      // Vérifier que tous les appels ont retourné la même erreur
      results.forEach(result => {
        expect(result).toContain('doit être implémentée');
      });
    });
  });
});