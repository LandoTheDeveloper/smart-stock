import passport from 'passport';
// @ts-ignore
import { Strategy as GoogleStrategy } from 'passport-google-oidc';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: ['openid', 'profile', 'email'],
    },
    async function verify(issuer: string, profile: any, cb: any) {
      try {
        // Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        // If not found by googleId, try finding by email
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!user && email) {
          user = await User.findOne({ email });
          if (user) {
            // Link googleId to existing account if email matches
            user.googleId = profile.id;
            await user.save();
          }
        }

        if (!user) {
          // Create new user
          user = await User.create({
            googleId: profile.id,
            email: email,
            name: profile.displayName,
            role: 'user',
          });
        }

        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    },
  ),
);

export default passport;

// force rebuild
