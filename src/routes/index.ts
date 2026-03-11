import { Router, type NextFunction, type Request, type Response } from "express";

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
    title: "Dashboard",
  });
});
