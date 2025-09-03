const nodemailer = require('nodemailer');

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Pay4U Support <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Production: Use SendGrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }

    // Development: Use Gmail SMTP
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = this.generateHTML(template);
    const text = this.generateText(template);

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
    
    // Log email details for debugging
    console.log('=== EMAIL SENT ===');
    console.log('To:', this.to);
    console.log('Subject:', subject);
    console.log('Template:', template);
    if (template === 'passwordReset') {
      console.log('Reset URL:', this.url);
      console.log('Reset Token:', this.url.split('/').pop());
    }
    console.log('==================');
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Pay4U!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }

  generateHTML(template) {
    if (template === 'welcome') {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Pay4U, ${this.firstName}!</h2>
          <p>Thank you for joining Pay4U. We're excited to have you on board!</p>
          <p>You can now start using our payment services.</p>
          <p>Best regards,<br>The Pay4U Team</p>
        </div>
      `;
    }

    if (template === 'passwordReset') {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi ${this.firstName},</p>
          <p>You requested a password reset for your Pay4U account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 10 minutes for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The Pay4U Team</p>
        </div>
      `;
    }

    return '<p>Email template not found</p>';
  }

  generateText(template) {
    if (template === 'welcome') {
      return `Welcome to Pay4U, ${this.firstName}! Thank you for joining us.`;
    }

    if (template === 'passwordReset') {
      return `Hi ${this.firstName}, you requested a password reset. Visit this link to reset your password: ${this.url}. This link expires in 10 minutes.`;
    }

    return 'Email content';
  }
}

module.exports = Email;