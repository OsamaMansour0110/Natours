const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  // Get Needed informaiton from logged in User or The one He singing up
  constructor(user, url) {
    this.to = user.email;
    this.url = url;
    this.firstName = user.name.split(' ')[0];
    this.from = 'osamamansour0110@gmail.com';
  }

  // Abstract The Transporter into Function
  newTransporter() {
    if (process.env.NODE_ENV === 'production') {
      // Using sendgrid or Use gmail With auth from config
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_NAME,
          pass: process.env.SENDGRID_PASS
        }
      });
    }

    //Return CREATED TRANSPORTER Using MailTrap
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_NAME,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // SEND the Actual Email
  async send(template, subject) {
    // 1) RENDER Html on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html, { wordwrap: 130 })
    };

    // 3) Create transporter and send Email
    await this.newTransporter().sendMail(mailOptions);
  }

  // Send Welcome Email For signing up
  async sendWelcom() {
    await this.send('welcome', 'Welcome to Natours Family');
  }

  // Send Reset password link
  async sendResetPassword() {
    await this.send(
      'resetPassword',
      'Your password reset token valid for 10 min'
    );
  }
};
