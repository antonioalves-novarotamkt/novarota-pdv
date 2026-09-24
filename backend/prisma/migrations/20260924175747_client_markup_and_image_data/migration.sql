-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "defaultMarkup" DOUBLE PRECISION NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "data" BYTEA,
ADD COLUMN     "mimeType" TEXT;
