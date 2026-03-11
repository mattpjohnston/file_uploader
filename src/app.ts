import "dotenv/config";
import path from "node:path";

import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import express from "express";
import session from "express-session";

import { passport } from "./config/passport.js";
import { prisma } from "./lib/prisma.js";
import { authRouter } from "./routes/auth.js";
import { indexRouter } from "./routes/index.js";

const app = express();
const port = Number(process.env.PORT) || 3000;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set.");
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(process.cwd(), "public")));

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
    }),
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.currentUser = req.user ?? null;
  next();
});

app.use(authRouter);
app.use(indexRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
