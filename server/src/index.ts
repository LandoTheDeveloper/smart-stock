import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import { connectDatabase } from './config/database';
import passport from './config/passport';

dotenv.config({ path: path.join(__dirname, '../.env') });

import routes from './routes';

const app: Application = express();

// Connect to MongoDB
connectDatabase();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      // TODO: REMOVE, MOBILE DEV ONLY
      'https://nonedified-bailey-slangily.ngrok-free.dev',
      'http://nonedified-bailey-slangily.ngrok-free.dev'
    ],
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'smart-stock-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 5 // 5 minutes
  }
}));
app.use(passport.initialize()); 

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('🚀 Smart Stock API is running!');
});

// Mount all API routes
app.use('/api', routes);

app.get('/api/test', (req, res) => {
  res.json({ test: 'works' });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Smart Stock API listening on port ${PORT}`);
});
// restart