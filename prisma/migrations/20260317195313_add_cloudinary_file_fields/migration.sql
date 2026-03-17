-- AlterTable
ALTER TABLE "File" ADD COLUMN     "cloudinaryPublicId" TEXT,
ADD COLUMN     "url" TEXT,
ALTER COLUMN "storedName" DROP NOT NULL,
ALTER COLUMN "path" DROP NOT NULL;
