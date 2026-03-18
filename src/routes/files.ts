import fs from "node:fs";

import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";

import { upload } from "../config/multer.js";
import {
  deleteFromCloudinary,
  getCloudinaryDownloadUrl,
  uploadToCloudinary,
} from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";

export const filesRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  res.redirect("/login");
}

filesRouter.get("/dashboard", requireAuth, async (req, res, next) => {
  const user = req.user;

  if (!user) {
    res.redirect("/login");
    return;
  }

  try {
    const folders = await prisma.folder.findMany({
      where: {
        parentId: null,
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    const files = await prisma.file.findMany({
      where: {
        folderId: null,
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.render("dashboard", {
      currentUser: user,
      error: typeof req.query.error === "string" ? req.query.error : "",
      files,
      folders,
      success: typeof req.query.success === "string" ? req.query.success : "",
      title: "Dashboard",
    });
  } catch (error) {
    next(error);
  }
});

filesRouter.get("/folders/:id", requireAuth, async (req, res, next) => {
  const user = req.user;
  const folderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!user) {
    res.redirect("/login");
    return;
  }

  if (!folderId) {
    res.redirect("/dashboard?error=Folder%20not%20found.");
    return;
  }

  try {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
      },
      include: {
        parent: true,
      },
    });

    if (!folder) {
      res.redirect("/dashboard?error=Folder%20not%20found.");
      return;
    }

    const folders = await prisma.folder.findMany({
      where: {
        parentId: folder.id,
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    const files = await prisma.file.findMany({
      where: {
        folderId: folder.id,
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.render("folder", {
      currentFolder: folder,
      currentUser: user,
      error: typeof req.query.error === "string" ? req.query.error : "",
      files,
      folders,
      success: typeof req.query.success === "string" ? req.query.success : "",
      title: folder.name,
    });
  } catch (error) {
    next(error);
  }
});

filesRouter.get("/files/:id", requireAuth, async (req, res, next) => {
  const user = req.user;
  const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!user) {
    res.redirect("/login");
    return;
  }

  if (!fileId) {
    res.redirect("/dashboard?error=File%20not%20found.");
    return;
  }

  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
      include: {
        folder: true,
      },
    });

    if (!file) {
      res.redirect("/dashboard?error=File%20not%20found.");
      return;
    }

    res.render("file", {
      currentUser: user,
      error: typeof req.query.error === "string" ? req.query.error : "",
      file,
      title: file.name,
    });
  } catch (error) {
    next(error);
  }
});

filesRouter.get("/files/:id/download", requireAuth, async (req, res, next) => {
  const user = req.user;
  const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!user) {
    res.redirect("/login");
    return;
  }

  if (!fileId) {
    res.redirect("/dashboard?error=File%20not%20found.");
    return;
  }

  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
    });

    if (!file) {
      res.redirect("/dashboard?error=File%20not%20found.");
      return;
    }

    if (file.cloudinaryPublicId) {
      res.redirect(getCloudinaryDownloadUrl(file.cloudinaryPublicId, file.name));
      return;
    }

    if (file.url) {
      res.redirect(file.url);
      return;
    }

    if (!file.path) {
      res.redirect(`/files/${file.id}?error=This%20file%20is%20missing%20from%20storage.`);
      return;
    }

    if (!fs.existsSync(file.path)) {
      res.redirect(`/files/${file.id}?error=This%20file%20is%20missing%20from%20storage.`);
      return;
    }

    res.download(file.path, file.name);
  } catch (error) {
    next(error);
  }
});

filesRouter.post("/folders", requireAuth, async (req, res, next) => {
  const user = req.user;
  const name = String(req.body.name ?? "").trim();
  const parentId = String(req.body.parentId ?? "").trim();
  const redirectPath = parentId ? `/folders/${parentId}` : "/dashboard";

  if (!user) {
    res.redirect("/login");
    return;
  }

  if (!name) {
    res.redirect(`${redirectPath}?error=Enter%20a%20folder%20name.`);
    return;
  }

  try {
    let folderId: string | null = null;

    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          userId: user.id,
        },
      });

      if (!parentFolder) {
        res.redirect("/dashboard?error=Folder%20not%20found.");
        return;
      }

      folderId = parentFolder.id;
    }

    await prisma.folder.create({
      data: {
        name,
        parentId: folderId,
        userId: user.id,
      },
    });

    res.redirect(`${redirectPath}?success=${encodeURIComponent(`Created folder ${name}.`)}`);
  } catch (error) {
    next(error);
  }
});

filesRouter.post("/upload", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, async (error) => {
    const user = req.user;
    const folderId = String(req.body.folderId ?? "").trim();
    const redirectPath = folderId ? `/folders/${folderId}` : "/dashboard";

    if (!user) {
      res.redirect("/login");
      return;
    }

    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        res.redirect(
          `${redirectPath}?error=File%20is%20too%20large.%20Maximum%20size%20is%205%20MB.`,
        );
        return;
      }

      if (error instanceof Error && error.message === "INVALID_FILE_TYPE") {
        res.redirect(
          `${redirectPath}?error=Only%20PNG,%20JPG,%20PDF,%20and%20TXT%20files%20are%20allowed.`,
        );
        return;
      }

      res.redirect(
        `${redirectPath}?error=The%20upload%20did%20not%20complete.%20Please%20try%20again.`,
      );
      return;
    }

    if (!req.file) {
      res.redirect(`${redirectPath}?error=Choose%20a%20file%20before%20submitting%20the%20form.`);
      return;
    }

    let uploadedAsset: { public_id: string; secure_url: string } | null = null;

    try {
      let targetFolderId: string | null = null;

      if (folderId) {
        const folder = await prisma.folder.findFirst({
          where: {
            id: folderId,
            userId: user.id,
          },
        });

        if (!folder) {
          fs.unlink(req.file.path, () => {});
          res.redirect("/dashboard?error=Folder%20not%20found.");
          return;
        }

        targetFolderId = folder.id;
      }

      uploadedAsset = await uploadToCloudinary(req.file.path);

      await prisma.file.create({
        data: {
          cloudinaryPublicId: uploadedAsset.public_id,
          folderId: targetFolderId,
          mimeType: req.file.mimetype || null,
          name: req.file.originalname,
          path: null,
          size: req.file.size,
          storedName: null,
          url: uploadedAsset.secure_url,
          userId: user.id,
        },
      });

      fs.unlink(req.file.path, () => {});
      res.redirect(
        `${redirectPath}?success=${encodeURIComponent(`Uploaded ${req.file.originalname}.`)}`,
      );
    } catch (uploadError) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }

      if (uploadedAsset) {
        await deleteFromCloudinary(uploadedAsset.public_id);
      }

      next(uploadError);
    }
  });
});
