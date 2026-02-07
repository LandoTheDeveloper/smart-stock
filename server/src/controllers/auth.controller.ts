import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import crypto from 'crypto';
import {sendVerificationEmail} from '../utils/sendEmail';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  console.error(
    'JWT_SECRET NOT LOADING FROM .ENV FOR SOME REASON. API WILL NOT WORK.'
  );
  process.exit(1);
}

interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response
) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email,
      password,
      name,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 1 * 60 * 60 * 1000),
      isVerified: false
    });


    console.log(`Attempting to send verification email to: ${email}`);
    await sendVerificationEmail(user.email, verificationToken);
    console.log('sendVerificationEmail call complete.');

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);

    if (error.name === 'ValidationError' && error.errors) {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    if (error.errors) {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

export const login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user: IUser | null = await User.findOne({ email }).select(
      '+password'
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in."
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Token missing' });
    }

    // Find the user with this exact token that hasn’t expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.json({ success: true, message: 'Email verified!' });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};




export const getProfile = async (req: Request, res: Response) => {
  res.json({
    success: true,
    user: (req as any).user,
  });
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Find user in database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already verified' 
      });
    }

    // Rate limiting: Check last sent time
    const now = new Date();
    const lastSent = user.verificationEmailLastSent;
    if (lastSent && (now.getTime() - lastSent.getTime()) < 60000) { // 60 seconds
      return res.status(429).json({ 
        success: false,
        message: 'Please wait before requesting another email' 
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user in database
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = tokenExpiry;
    user.verificationEmailLastSent = now;
    await user.save();

    // Send email
    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({ 
      success: true,
      message: 'Verification email sent successfully' 
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send verification email' 
    });
  }
};
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IUser | undefined;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=AuthenticationFailed`);
    }

    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Determine redirect URL based on state
    const state = req.query.state as string;
    const cookies = req.headers.cookie || '';
    const isMobile = cookies.includes('platform=mobile');

    // Extract redirect_uri from cookie
    let redirectUri = '';
    const match = cookies.match(/redirect_uri=([^;]+)/);
    if (match) {
      redirectUri = decodeURIComponent(match[1]);
    }

    let targetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-callback`;

    if (state === 'mobile' || isMobile) {
      if (isMobile) {
        res.clearCookie('platform');
        res.clearCookie('redirect_uri');
      }
      targetUrl = redirectUri || 'smartstockmobile://oauth-callback';
    }

    // Redirect to client application with token
    // Check if targetUrl already has params (from expo deep link structure)
    // and append properly.
    const finalUrl = targetUrl.includes('?')
      ? `${targetUrl}&token=${token}`
      : `${targetUrl}?token=${token}`;

    res.redirect(finalUrl);
  } catch (error) {
    console.error('Google Auth Error:', error);

    const state = req.query.state as string;
    const cookies = req.headers.cookie || '';
    const isMobile = cookies.includes('platform=mobile');

    // Extract redirect_uri from cookie for error case too
    let redirectUri = '';
    const match = cookies.match(/redirect_uri=([^;]+)/);
    if (match) {
      redirectUri = decodeURIComponent(match[1]);
    }

    if (state === 'mobile' || isMobile) {
      if (isMobile) {
        res.clearCookie('platform');
        res.clearCookie('redirect_uri');
      }

      const targetUrl = redirectUri || 'smartstockmobile://login';
      const finalUrl = targetUrl.includes('?')
        ? `${targetUrl}&error=ServerAuthError`
        : `${targetUrl}?error=ServerAuthError`;

      return res.redirect(finalUrl);
    }

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=ServerAuthError`);
  }
};
