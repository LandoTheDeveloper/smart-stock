import express from 'express';
import passport from 'passport';
import { register, login, getProfile, googleCallback } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getProfile);

// Google Auth Routes
router.get('/google', (req, res, next) => {
    const platform = req.query.platform ? String(req.query.platform) : undefined;

    if (platform === 'mobile') {
        res.cookie('platform', 'mobile', { httpOnly: true, maxAge: 300000 });
    }

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state: platform
    })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err: any, user: any, info: any) => {
        if (err || !user) {
            const state = req.query.state as string;
            const cookies = req.headers.cookie || '';
            const isMobile = cookies.includes('platform=mobile');

            if (state === 'mobile' || isMobile) {
                res.clearCookie('platform');
                // TODO: Change this to the actual URL of the mobile app (dynamic linking)
                return res.redirect('exp://192.168.1.215:8081/--/login?error=AuthenticationFailed');
            }
            return res.redirect('http://localhost:5173/login?error=AuthenticationFailed');
        }
        req.user = user;
        next();
    })(req, res, next);
}, googleCallback);

export default router;