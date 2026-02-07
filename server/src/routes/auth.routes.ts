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
    const redirectUri = req.query.redirect_uri ? String(req.query.redirect_uri) : undefined;

    if (platform === 'mobile') {
        res.cookie('platform', 'mobile', { httpOnly: true, maxAge: 300000 });
    }

    if (redirectUri) {
        res.cookie('redirect_uri', redirectUri, { httpOnly: true, maxAge: 300000 });
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

            let redirectUri = '';
            const match = cookies.match(/redirect_uri=([^;]+)/);
            if (match) {
                redirectUri = decodeURIComponent(match[1]);
            }

            // Handle mobile authentication failure by clearing cookies and redirecting to the app's deep link
            if (state === 'mobile' || isMobile) {
                res.clearCookie('platform');
                res.clearCookie('redirect_uri');

                const targetUrl = redirectUri || 'smartstockmobile://login';


                const finalUrl = targetUrl.includes('?')
                    ? `${targetUrl}&error=AuthenticationFailed`
                    : `${targetUrl}?error=AuthenticationFailed`;

                return res.redirect(finalUrl);
            }
            return res.redirect('http://localhost:5173/login?error=AuthenticationFailed');
        }
        req.user = user;
        next();
    })(req, res, next);
}, googleCallback);

export default router;