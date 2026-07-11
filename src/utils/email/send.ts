import nodemailer from "nodemailer";

async function sendMail({
  to,
  subject,
  htmlTemplate,
}: {
  to: string;
  subject: string;
  htmlTemplate: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: subject,
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    console.error("Nodemailer Util Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
export default sendMail;
