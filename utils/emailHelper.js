const nodemailer = require('nodemailer');

const mailHelpre = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: '"Vatsal" vatsalparmar33@gmail.com', // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message, // plain text body
    // html: '<a>Hello world</a>', // html body
  };

  // send mail with defined transport object
  const info = await transporter.sendMail(message);
};

module.exports = mailHelpre;
