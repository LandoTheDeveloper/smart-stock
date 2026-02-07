import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  const base_url = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${base_url}/verify-email?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'SmartStock <noreply@smart-stock.food>',
      to: email,
      subject: 'Confirm your SmartStock Account',
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
    });

    if (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Could not send verification email.');
    }

    console.log('Verification email sent:', data?.id);
    return data;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Could not send verification email.');
  }
};
