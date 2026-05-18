import { transporter } from "../config/mailConfig.js";

export const sendMail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"AI HR System" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    };
    await transporter.sendMail(mailOptions);
    console.log(`📧 Mail sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Mail send failed:", error.message);
    throw error;
  }
};
