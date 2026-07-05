const { createTransport } = require("nodemailer");

let transport = null;

function getTransport() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    return null;
  }
  if (!transport) {
    transport = createTransport({
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  return transport;
}

const sendMail = async (to, subject, html) => {
  const mailer = getTransport();
  if (!mailer) {
    console.warn(
      `[Passiar] Email not configured. Would send to ${to}: ${subject}`
    );
    return { skipped: true };
  }

  try {
    const info = await mailer.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

module.exports = {
  sendMail,
};
