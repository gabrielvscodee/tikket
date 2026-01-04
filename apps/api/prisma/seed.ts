import { PrismaClient, UserRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Criar Tenant default
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Company',
      slug: 'default',
    },
  })

  console.log('✅ Tenant created:', tenant.slug)

  // 2. Criar usuário ADMIN
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@default.com' },
    update: {},
    create: {
      email: 'admin@default.com',
      password: passwordHash,
      name: 'Admin',
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Admin user created:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
