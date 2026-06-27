import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ Gmail Connection Failed");
        console.error(error.message);
      } else {
        console.log("✅ Gmail SMTP Connected");
      }
    });
  }

  return transporter;
};

export default getTransporter;