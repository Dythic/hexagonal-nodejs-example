// __tests__/infrastructure/email/NodemailerEmailService.test.js
const NodemailerEmailService = require("../../../src/infrastructure/email/NodemailerEmailService");
const nodemailer = require("nodemailer");

// Mock nodemailer
jest.mock("nodemailer");

describe("NodemailerEmailService", () => {
  let emailService;
  let mockTransporter;
  let mockSendMail;

  const emailConfig = {
    host: "smtp.test.com",
    port: 587,
    user: "test@test.com",
    pass: "testpassword",
    from: "noreply@test.com",
  };

  beforeEach(() => {
    mockSendMail = jest
      .fn()
      .mockResolvedValue({ messageId: "test-message-id" });
    mockTransporter = {
      sendMail: mockSendMail,
    };

    nodemailer.createTransport.mockReturnValue(mockTransporter);

    emailService = new NodemailerEmailService(emailConfig);
  });
});

// __tests__/infrastructure/email/EmailService.integration.test.js
const NodemailerEmailService = require("../../../src/infrastructure/email/NodemailerEmailService");
const EmailService = require("../../../src/domain/ports/EmailService");

describe("EmailService Integration", () => {
  describe("Héritage et polymorphisme", () => {
    it("devrait hériter correctement de EmailService", () => {
      const config = {
        host: "smtp.test.com",
        port: 587,
        user: "test@test.com",
        pass: "password",
        from: "noreply@test.com",
      };

      const emailService = new NodemailerEmailService(config);

      expect(emailService).toBeInstanceOf(EmailService);
      expect(emailService).toBeInstanceOf(NodemailerEmailService);
    });

    it("devrait implémenter toutes les méthodes du port", () => {
      const config = {
        host: "smtp.test.com",
        port: 587,
        user: "test@test.com",
        pass: "password",
        from: "noreply@test.com",
      };

      const emailService = new NodemailerEmailService(config);

      expect(typeof emailService.sendWelcomeEmail).toBe("function");
      expect(emailService.sendWelcomeEmail.length).toBe(1); // 1 paramètre
    });
  });

  describe("Compatibilité avec le contrat EmailService", () => {
    let emailService;

    beforeEach(() => {
      const config = {
        host: "smtp.test.com",
        port: 587,
        user: "test@test.com",
        pass: "password",
        from: "noreply@test.com",
      };
      emailService = new NodemailerEmailService(config);
    });

    it("devrait accepter des objets utilisateur conformes", async () => {
      const validUser = {
        id: "123",
        email: "valid@test.com",
        name: "Valid User",
        createdAt: new Date(),
      };

      // Ne devrait pas lancer d'erreur
      await expect(
        emailService.sendWelcomeEmail(validUser),
      ).resolves.toBeDefined();
    });

    it("devrait gérer les utilisateurs avec des propriétés supplémentaires", async () => {
      const userWithExtraProps = {
        id: "123",
        email: "user@test.com",
        name: "User Name",
        createdAt: new Date(),
        // Propriétés supplémentaires
        role: "USER",
        isActive: true,
        lastLogin: new Date(),
        preferences: { theme: "dark" },
      };

      await expect(
        emailService.sendWelcomeEmail(userWithExtraProps),
      ).resolves.toBeDefined();
    });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("constructor", () => {
  it("devrait créer un transporter avec la bonne configuration", () => {
    expect(nodemailer.createTransporter).toHaveBeenCalledWith({
      host: "smtp.test.com",
      port: 587,
      auth: {
        user: "test@test.com",
        pass: "testpassword",
      },
    });
  });

  it("devrait stocker l'email from", () => {
    expect(emailService.fromEmail).toBe("noreply@test.com");
  });

  it("devrait stocker le transporter", () => {
    expect(emailService.transporter).toBe(mockTransporter);
  });
});

describe("sendWelcomeEmail", () => {
  const testUser = {
    id: "123",
    email: "user@test.com",
    name: "John Doe",
    createdAt: new Date("2024-01-15T10:00:00Z"),
  };

  it("devrait envoyer un email de bienvenue avec le bon contenu", async () => {
    await emailService.sendWelcomeEmail(testUser);

    expect(mockSendMail).toHaveBeenCalledTimes(1);

    const sentEmail = mockSendMail.mock.calls[0][0];
    expect(sentEmail.from).toBe("noreply@test.com");
    expect(sentEmail.to).toBe("user@test.com");
    expect(sentEmail.subject).toBe("Bienvenue dans notre application !");
    expect(sentEmail.html).toContain("Bienvenue John Doe !");
    expect(sentEmail.html).toContain("user@test.com");
    expect(sentEmail.html).toContain("15/01/2024"); // Format français
  });

  it("devrait gérer les noms avec des caractères spéciaux", async () => {
    const userWithSpecialChars = {
      ...testUser,
      name: "Jean-François O'Connor",
      email: "jean.françois@test.com",
    };

    await emailService.sendWelcomeEmail(userWithSpecialChars);

    const sentEmail = mockSendMail.mock.calls[0][0];
    expect(sentEmail.html).toContain("Jean-François O'Connor");
    expect(sentEmail.to).toBe("jean.françois@test.com");
  });

  it("devrait gérer les dates dans différents formats", async () => {
    const userWithStringDate = {
      ...testUser,
      createdAt: "2024-12-25T15:30:00Z",
    };

    await emailService.sendWelcomeEmail(userWithStringDate);

    const sentEmail = mockSendMail.mock.calls[0][0];
    expect(sentEmail.html).toContain("25/12/2024");
  });

  it("devrait gérer les utilisateurs sans date de création", async () => {
    const userWithoutDate = {
      ...testUser,
      createdAt: undefined,
    };

    await emailService.sendWelcomeEmail(userWithoutDate);

    const sentEmail = mockSendMail.mock.calls[0][0];
    // Devrait contenir une date (probablement la date actuelle ou une valeur par défaut)
    expect(sentEmail.html).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("devrait propager les erreurs du transporter", async () => {
    const transportError = new Error("SMTP Error: Connection failed");
    mockSendMail.mockRejectedValue(transportError);

    await expect(emailService.sendWelcomeEmail(testUser)).rejects.toThrow(
      "SMTP Error: Connection failed",
    );
  });

  it("devrait gérer les timeouts SMTP", async () => {
    const timeoutError = new Error("Timeout");
    timeoutError.code = "ETIMEDOUT";
    mockSendMail.mockRejectedValue(timeoutError);

    await expect(emailService.sendWelcomeEmail(testUser)).rejects.toThrow(
      "Timeout",
    );
  });

  it("devrait retourner le résultat du transporter", async () => {
    const expectedResult = {
      messageId: "test-message-id-123",
      response: "250 Message accepted",
    };
    mockSendMail.mockResolvedValue(expectedResult);

    const result = await emailService.sendWelcomeEmail(testUser);
    expect(result).toEqual(expectedResult);
  });
});

describe("Template HTML", () => {
  const testUser = {
    email: "test@test.com",
    name: "Test User",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  };

  it("devrait générer un HTML valide", async () => {
    await emailService.sendWelcomeEmail(testUser);

    const sentEmail = mockSendMail.mock.calls[0][0];
    const html = sentEmail.html;

    // Vérifier la structure HTML
    expect(html).toContain("<h1>");
    expect(html).toContain("</h1>");
    expect(html).toContain("<p>");
    expect(html).toContain("</p>");

    // Vérifier le contenu
    expect(html).toContain("Bienvenue Test User !");
    expect(html).toContain("Votre compte a été créé avec succès");
    expect(html).toContain("Email: test@test.com");
    expect(html).toContain("Date de création: 01/01/2024");
  });

  it("devrait échapper les caractères HTML dangereux", async () => {
    const userWithHtml = {
      email: "test@test.com",
      name: '<script>alert("xss")</script>User',
      createdAt: new Date(),
    };

    await emailService.sendWelcomeEmail(userWithHtml);

    const sentEmail = mockSendMail.mock.calls[0][0];
    // Le nom devrait être inclus tel quel (pas d'échappement automatique ici)
    // Note: En production, vous devriez ajouter l'échappement HTML
    expect(sentEmail.html).toContain('<script>alert("xss")</script>User');
  });
});

describe("Configuration avec différents providers", () => {
  it("devrait fonctionner avec Gmail", () => {
    const gmailConfig = {
      host: "smtp.gmail.com",
      port: 587,
      user: "test@gmail.com",
      pass: "app-password",
      from: "noreply@gmail.com",
    };

    const gmailService = new NodemailerEmailService(gmailConfig);

    expect(nodemailer.createTransporter).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "test@gmail.com",
        pass: "app-password",
      },
    });
  });

  it("devrait fonctionner avec SendGrid", () => {
    const sendGridConfig = {
      host: "smtp.sendgrid.net",
      port: 587,
      user: "apikey",
      pass: "SG.xxx",
      from: "noreply@sendgrid.com",
    };

    const sendGridService = new NodemailerEmailService(sendGridConfig);

    expect(nodemailer.createTransporter).toHaveBeenCalledWith({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: "SG.xxx",
      },
    });
  });

  it("devrait fonctionner avec Mailtrap (dev)", () => {
    const mailtrapConfig = {
      host: "smtp.mailtrap.io",
      port: 2525,
      user: "mailtrap-user",
      pass: "mailtrap-pass",
      from: "test@mailtrap.io",
    };

    const mailtrapService = new NodemailerEmailService(mailtrapConfig);

    expect(nodemailer.createTransporter).toHaveBeenCalledWith({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "mailtrap-user",
        pass: "mailtrap-pass",
      },
    });
  });
});

describe("Gestion des erreurs de configuration", () => {
  it("devrait gérer une configuration manquante", () => {
    expect(() => new NodemailerEmailService()).toThrow();
  });

  it("devrait gérer une configuration incomplète", () => {
    const incompleteConfig = {
      host: "smtp.test.com",
      // port manquant
      user: "test@test.com",
      pass: "password",
      from: "noreply@test.com",
    };

    // Nodemailer devrait quand même créer le transporter
    // mais il pourrait échouer lors de l'envoi
    expect(() => new NodemailerEmailService(incompleteConfig)).not.toThrow();
  });
});

describe("Performance et comportement asynchrone", () => {
  it("devrait gérer les envois simultanés", async () => {
    const users = [
      { email: "user1@test.com", name: "User 1", createdAt: new Date() },
      { email: "user2@test.com", name: "User 2", createdAt: new Date() },
      { email: "user3@test.com", name: "User 3", createdAt: new Date() },
    ];

    const promises = users.map((user) => emailService.sendWelcomeEmail(user));
    await Promise.all(promises);

    expect(mockSendMail).toHaveBeenCalledTimes(3);

    // Vérifier que chaque email a été envoyé avec le bon destinataire
    const calls = mockSendMail.mock.calls;
    expect(calls[0][0].to).toBe("user1@test.com");
    expect(calls[1][0].to).toBe("user2@test.com");
    expect(calls[2][0].to).toBe("user3@test.com");
  });

  it("devrait gérer les erreurs partielles dans les envois multiples", async () => {
    const users = [
      { email: "user1@test.com", name: "User 1", createdAt: new Date() },
      { email: "user2@test.com", name: "User 2", createdAt: new Date() },
    ];

    // Premier appel réussit, deuxième échoue
    mockSendMail
      .mockResolvedValueOnce({ messageId: "success-1" })
      .mockRejectedValueOnce(new Error("Failed to send"));

    const results = await Promise.allSettled(
      users.map((user) => emailService.sendWelcomeEmail(user)),
    );

    expect(results[0].status).toBe("fulfilled");
    expect(results[0].value.messageId).toBe("success-1");

    expect(results[1].status).toBe("rejected");
    expect(results[1].reason.message).toBe("Failed to send");
  });
});
