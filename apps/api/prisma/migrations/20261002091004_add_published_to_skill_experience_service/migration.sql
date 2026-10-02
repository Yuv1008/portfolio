-- DropIndex
DROP INDEX "Experience_order_idx";

-- DropIndex
DROP INDEX "Service_order_idx";

-- DropIndex
DROP INDEX "Skill_order_idx";

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Experience_published_order_idx" ON "Experience"("published", "order");

-- CreateIndex
CREATE INDEX "Service_published_order_idx" ON "Service"("published", "order");

-- CreateIndex
CREATE INDEX "Skill_published_order_idx" ON "Skill"("published", "order");
