/*
  SAFE MIGRATION — Multi-tenant bootstrap
*/

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AGENT', 'USER');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- Insert default tenant (for existing users)
INSERT INTO "Tenant" ("id", "name", "slug")
VALUES ('default-tenant', 'Default Tenant', 'default')
ON CONFLICT DO NOTHING;

-- AlterTable (SAFE)
ALTER TABLE "User"
ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Admin',
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'default-tenant';

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Remove defaults (professional touch)
ALTER TABLE "User"
ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "role" DROP DEFAULT,
ALTER COLUMN "tenantId" DROP DEFAULT;
