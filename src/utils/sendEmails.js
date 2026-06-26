import nodemailer from "nodemailer";

const sendEmail = async({to, subject , html}) => {

    const transporter = nodemailer.createTransport(
        {
            service: "gmail",
            auth: {
                user:"chakshu0527@gmail.com",
                pass:"jowd ogwp jcjl nuyo"
            }
        }
    );

    transporter.sendMail({
        from: "chakshu0527@gmail.com",
        to,
        subject,
        html
    });
}


export {sendEmail}