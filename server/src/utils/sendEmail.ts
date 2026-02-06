import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  // Change this to point to your FRONTEND URL
  const base_url = process.env.BASE_URL || 'http://localhost:5173';
  const verificationUrl = `${base_url}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"SmartStock Team" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Confirm your SmartStock Account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Welcome to SmartStock!</h2>
        <p>Hi there,</p>
        <p>Thank you for signing up for SmartStock. We're excited to help you manage your pantry and reduce food waste!</p>
        <p>Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Verify My Email
          </a>
        </div>
        <p style="font-size: 12px; color: #888;">
          If the button above doesn't work, copy and paste this link into your browser:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          This link will expire in 24 hours. If you did not create an account, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Could not send verification email.');
  }
};