import { Router, type NextFunction, type Request, type Response } from "express";

import { upload } from "../config/multer.js";

export const indexRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  res.redirect("/login");
}

indexRouter.get("/", (req, res) => {
  res.render("index", {
    currentUser: req.user ?? null,
    title: "File Uploader",
  });
});

indexRouter.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", {
    currentUser: req.user,
    error: typeof req.query.error === "string" ? req.query.error : "",
    success: typeof req.query.success === "string" ? req.query.success : "",
    title: "Dashboard",
  });
});

indexRouter.post("/upload", requireAuth, (req, res) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      res.redirect("/dashboard?error=The%20upload%20did%20not%20complete.%20Please%20try%20again.");
      return;
    }

    if (!req.file) {
      res.redirect("/dashboard?error=Choose%20a%20file%20before%20submitting%20the%20form.");
      return;
    }

    res.redirect(`/dashboard?success=${encodeURIComponent(`Uploaded ${req.file.originalname}.`)}`);
  });
});
