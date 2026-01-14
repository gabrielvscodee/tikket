/*
  Warnings:

  - Added the required column `updatedAt` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "emailFrom" TEXT,
ADD COLUMN     "emailSmtpHost" TEXT,
ADD COLUMN     "emailSmtpPassword" TEXT,
ADD COLUMN     "emailSmtpPort" INTEGER,
ADD COLUMN     "emailSmtpSecure" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailSmtpUser" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
