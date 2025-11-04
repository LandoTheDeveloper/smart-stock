/**
 * Smart Stock API Entry Point
 * -------------------------------------
 * This file starts the Express server, configures middleware,
 * and defines the base health check route.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Load environment variables from .env file
dotenv.config();

const app: Application = express();

// -----------------------------
// MongoDB Connection
// -----------------------------
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/smart-stock')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// -----------------------------
// User Model
// -----------------------------
interface IUser {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model<IUser>('User', userSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json());              // Parse JSON request bodies
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));                                  // Enable CORS for frontend requests
app.use(morgan('dev'));               // Log HTTP requests in the console

// -----------------------------
// Types
// -----------------------------
interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface JWTPayload {
  userId: string;
  email: string;
}

interface AuthRequest extends Request {
  user?: any;
}

// -----------------------------
// Auth Middleware
// -----------------------------
const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// -----------------------------
// Routes
// -----------------------------
app.get('/', (req: Request, res: Response) => {
  res.send('🚀 Smart Stock API is running!');
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register Endpoint
app.post('/api/auth/register', async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      name,
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email } as JWTPayload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email } as JWTPayload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Protected Route Example
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Initialize correctly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Update the route
app.post('/api/generate', async (req: Request<{}, {}, { prompt: string }>, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ success: true, text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating content",
    });
  }
});

// -----------------------------
// Server Configuration
// -----------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Smart Stock API listening on port ${PORT}`);
});