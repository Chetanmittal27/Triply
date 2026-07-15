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
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
     })



    return await transporter.sendMail({
        from: process.env.MY_EMAIL,
        to,
        subject,
        html,
    });
};

export { sendEmail };