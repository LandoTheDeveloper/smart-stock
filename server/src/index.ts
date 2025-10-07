<<<<<<< HEAD
/**
 * Smart Stock API Entry Point
 * -------------------------------------
 * This file starts the Express server, configures middleware,
 * and defines the base health check route.
 */

import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';

// Load environment variables from .env file
dotenv.config();

const app: Application = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json());              // Parse JSON request bodies
app.use(cors());                      // Enable CORS for frontend requests
app.use(morgan('dev'));               // Log HTTP requests in the console

// -----------------------------
// Routes
// -----------------------------
app.get('/', (req: Request, res: Response) => {
  res.send('🚀 Smart Stock API is running!');
});

// Example API route (placeholder)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// -----------------------------
// Server Configuration
// -----------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Smart Stock API listening on port ${PORT}`);
});
=======
console.log("Hello World")
>>>>>>> 70823adffe3ef067d8835cf3f147d4fc2ace4263
