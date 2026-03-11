import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import { prisma } from "../lib/prisma.js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

passport.use(
  new LocalStrategy(
    {
      passwordField: "password",
      usernameField: "email",
    },
    async (email, password, done) => {
      try {
        const normalizedEmail = normalizeEmail(email);
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          return done(null, false, {
            message: "Invalid email or password.",
          });
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
          return done(null, false, {
            message: "Invalid email or password.",
          });
        }

        return done(null, {
          email: user.email,
          id: user.id,
        });
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      select: {
        email: true,
        id: true,
      },
      where: {
        id,
      },
    });

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

export { passport };
