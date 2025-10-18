import dotenv from "dotenv";
dotenv.config();
import nodemailer from 'nodemailer'

export function sendEmailNotification(message, callback){

  const DOMAIN = process.env.DOMAIN;
  const EMAIL_SERVER = "mail." + DOMAIN;
  const EMAIL_ADDRESS = "_mainaccount@" + DOMAIN;
  const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: EMAIL_SERVER,
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_ADDRESS,
      pass: EMAIL_PASSWORD,
    },
  });

  const email = {
    from: EMAIL_ADDRESS,
    to:process.env.MAIL_TO_ADDRESS,
    subject: 'AI Agent Workflow Run...',
    text: message
 };

 transporter.sendMail(email, callback);
}