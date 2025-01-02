import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import ejs from "ejs";
import path from "path";
dotenv.config();
const sendMail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });
    const { email, subject, template, data } = options;
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // get the pdath to the email template file
    const templatePath = path.join(__dirname, '../mails', template);
    // Render the email template with EJS
    const html = await ejs.renderFile(templatePath, data);
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html,
    };
    await transporter.sendMail(mailOptions);
};
export default sendMail;
