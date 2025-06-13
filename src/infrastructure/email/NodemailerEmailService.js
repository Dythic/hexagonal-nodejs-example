const nodemailer = require("nodemailer");
const EmailService = require("../../domain/ports/EmailService");

class NodemailerEmailService extends EmailService {
  constructor(config) {
    super();
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    this.fromEmail = config.from;
  }

  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: this.fromEmail,
      to: user.email,
      subject: "Bienvenue dans notre application !",
      html: `
        <h1>Bienvenue ${user.name} !</h1>
        <p>Votre compte a été créé avec succès.</p>
        <p>Email: ${user.email}</p>
        <p>Date de création: ${user.createdAt.toLocaleDateString("fr-FR")}</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = NodemailerEmailService;
