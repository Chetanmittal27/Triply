import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const sendEmail = async ({ to, subject, html }) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MY_EMAIL,
            pass: process.env.MY_PASS,
        },
    });

    return await transporter.sendMail({
        from: process.env.MY_EMAIL,
        to,
        subject,
        html,
    });
};

export { sendEmail };