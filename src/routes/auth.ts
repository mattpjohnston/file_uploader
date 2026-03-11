import bcrypt from "bcryptjs";
import { Router, type NextFunction, type Request, type Response } from "express";

import { passport } from "../config/passport.js";
import { prisma } from "../lib/prisma.js";

export const authRouter = Router();
const MIN_PASSWORD_LENGTH = 8;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function redirectIfLoggedIn(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
    return;
  }

  next();
}

authRouter.get("/register", redirectIfLoggedIn, (_req, res) => {
  res.render("register", {
    email: "",
    error: "",
    title: "Create account",
  });
});

authRouter.post("/register", redirectIfLoggedIn, async (req, res, next) => {
  const email = normalizeEmail(String(req.body.email ?? ""));
  const password = String(req.body.password ?? "");
  const confirmPassword = String(req.body.confirmPassword ?? "");

  if (!email || !password || !confirmPassword) {
    res.render("register", {
      email,
      error: "Fill out every field.",
      title: "Create account",
    });
    return;
  }

  if (!emailPattern.test(email)) {
    res.render("register", {
      email,
      error: "Enter a valid email address.",
      title: "Create account",
    });
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    res.render("register", {
      email,
      error: "Password must be at least 8 characters.",
      title: "Create account",
    });
    return;
  }

  if (password !== confirmPassword) {
    res.render("register", {
      email,
      error: "Passwords do not match.",
      title: "Create account",
    });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      res.render("register", {
        email,
        error: "That email is already registered.",
        title: "Create account",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { email: true, id: true },
    });

    req.logIn(user, (error) => {
      if (error) {
        next(error);
        return;
      }

      res.redirect("/dashboard");
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/login", redirectIfLoggedIn, (req, res) => {
  res.render("login", {
    error: typeof req.query.error === "string" ? req.query.error : "",
    title: "Log in",
  });
});

authRouter.post(
  "/login",
  redirectIfLoggedIn,
  passport.authenticate("local", {
    failureRedirect: "/login?error=Invalid%20email%20or%20password.",
    successRedirect: "/dashboard",
  }),
);

authRouter.post("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        next(sessionError);
        return;
      }

      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});
