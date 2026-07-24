const nodemailer = require("nodemailer");
const logger = require("../config/logger");

/**
 * Sends an email using Nodemailer or falls back to logging it in the console in development
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Subject of the email
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const hasSMTPConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasSMTPConfig) {
    logger.warn("SMTP credentials not fully configured in .env. Logging email to console.");
    logger.info(`
=========================================
MOCK EMAIL SENT TO: ${to}
SUBJECT: ${subject}
BODY:
${text || html}
=========================================
`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"App Auth" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    // Return false instead of crash, letting controller handle gracefully
    return false;
  }
};

module.exports = sendEmail;
