-- CreateTable
CREATE TABLE IF NOT EXISTS "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserDepartment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (drop if exists first)
DROP INDEX IF EXISTS "UserDepartment_userId_departmentId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "UserDepartment_userId_departmentId_key" ON "UserDepartment"("userId", "departmentId");

-- AddForeignKey (drop if exists first, then add)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Department_tenantId_fkey') THEN
        ALTER TABLE "Department" DROP CONSTRAINT "Department_tenantId_fkey";
    END IF;
END $$;
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserDepartment_userId_fkey') THEN
        ALTER TABLE "UserDepartment" DROP CONSTRAINT "UserDepartment_userId_fkey";
    END IF;
END $$;
ALTER TABLE "UserDepartment" ADD CONSTRAINT "UserDepartment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserDepartment_departmentId_fkey') THEN
        ALTER TABLE "UserDepartment" DROP CONSTRAINT "UserDepartment_departmentId_fkey";
    END IF;
END $$;
ALTER TABLE "UserDepartment" ADD CONSTRAINT "UserDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default department for each tenant
DO $$
DECLARE
    tenant_record RECORD;
    default_dept_id TEXT;
BEGIN
    FOR tenant_record IN SELECT id FROM "Tenant"
    LOOP
        -- Check if default department already exists
        SELECT id INTO default_dept_id FROM "Department" WHERE "tenantId" = tenant_record.id AND "name" = 'General' LIMIT 1;
        
        IF default_dept_id IS NULL THEN
            -- Create default department for this tenant
            default_dept_id := gen_random_uuid()::TEXT;
            INSERT INTO "Department" ("id", "name", "description", "tenantId", "createdAt", "updatedAt")
            VALUES (default_dept_id, 'General', 'Default department for existing tickets', tenant_record.id, NOW(), NOW());
        END IF;
    END LOOP;
END $$;

-- Add departmentId column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ticket' AND column_name = 'departmentId') THEN
        ALTER TABLE "Ticket" ADD COLUMN "departmentId" TEXT;
    END IF;
END $$;

-- Update all tickets to use default department
DO $$
DECLARE
    tenant_record RECORD;
    default_dept_id TEXT;
BEGIN
    FOR tenant_record IN SELECT id FROM "Tenant"
    LOOP
        SELECT id INTO default_dept_id FROM "Department" WHERE "tenantId" = tenant_record.id AND "name" = 'General' LIMIT 1;
        IF default_dept_id IS NOT NULL THEN
            UPDATE "Ticket" SET "departmentId" = default_dept_id WHERE "tenantId" = tenant_record.id AND ("departmentId" IS NULL OR "departmentId" = '');
        END IF;
    END LOOP;
END $$;

-- Drop existing foreign key if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_departmentId_fkey') THEN
        ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_departmentId_fkey";
    END IF;
END $$;

-- Make departmentId required
DO $$
BEGIN
    -- Check if column is nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Ticket' 
        AND column_name = 'departmentId' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE "Ticket" ALTER COLUMN "departmentId" SET NOT NULL;
    END IF;
END $$;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
