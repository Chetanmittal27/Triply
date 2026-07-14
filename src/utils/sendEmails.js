import nodemailer from "nodemailer";
import "dotenv/config";

const sendEmail = async ({ to, subject, html }) => {
    const user = process.env.MY_EMAIL?.trim();
    // Google app passwords are commonly copied with spaces (xxxx xxxx xxxx xxxx).
    const pass = process.env.MY_PASS?.replace(/\s/g, "");
    if (!user || !pass) {
        const error = new Error("Email service is not configured. Set MY_EMAIL and MY_PASS.");
        error.statusCode = 503;
        throw error;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass }
    });

    try {
        return await transporter.sendMail({ from: user, to, subject, html });
    } catch (error) {
        const mailError = new Error("Email could not be sent. Use a valid Gmail App Password (not your normal Gmail password) and ensure 2-Step Verification is enabled.");
        mailError.statusCode = 503;
        mailError.cause = error;
        throw mailError;
    }
};

export { sendEmail };