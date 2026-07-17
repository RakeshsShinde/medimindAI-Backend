import { eq } from "drizzle-orm";
import { users } from "../db/Schema";
import { db } from "./db";
import { env } from "../config/env";

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;


passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${env.BACKEND_URL}/api/auth/google/callback`
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        const email = profile.emails?.[0].value;
        if (!email) return done(null, false);

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (!user) {
            // add user to db 
            const [newUser] = await db
                .insert(users)
                .values({
                    email,
                    avatar: profile.photos?.[0]?.value,
                    authProvider: "google",
                })
                .returning();
            return done(null, newUser);
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

export default passport;