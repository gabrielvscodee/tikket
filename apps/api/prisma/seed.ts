import { PrismaClient, UserRole, Prisma } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create Tenant default
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Company',
      slug: 'default',
    },
  })

  console.log('✅ Tenant created:', tenant.slug)

  // 2. Create Departments
  const itDepartment = await prisma.department.upsert({
    where: { id: 'it-dept-id' },
    update: {},
    create: {
      id: 'it-dept-id',
      name: 'IT Support',
      description: 'Technical support and IT issues',
      tenantId: tenant.id,
    },
  })

  const hrDepartment = await prisma.department.upsert({
    where: { id: 'hr-dept-id' },
    update: {},
    create: {
      id: 'hr-dept-id',
      name: 'Human Resources',
      description: 'HR related requests and inquiries',
      tenantId: tenant.id,
    },
  })

  const salesDepartment = await prisma.department.upsert({
    where: { id: 'sales-dept-id' },
    update: {},
    create: {
      id: 'sales-dept-id',
      name: 'Sales',
      description: 'Sales and customer inquiries',
      tenantId: tenant.id,
    },
  })

  console.log('✅ Departments created')

  // 3. Create users
  const passwordHash = await bcrypt.hash('admin123', 10)
  const agentPasswordHash = await bcrypt.hash('agent123', 10)
  const userPasswordHash = await bcrypt.hash('user123', 10)

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@default.com' },
    update: {},
    create: {
      email: 'admin@default.com',
      password: passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Admin user created:', admin.email)

  // IT Agent
  const itAgent = await prisma.user.upsert({
    where: { email: 'it.agent@default.com' },
    update: {},
    create: {
      email: 'it.agent@default.com',
      password: agentPasswordHash,
      name: 'IT Agent',
      role: UserRole.AGENT,
      tenantId: tenant.id,
    },
  })

  // HR Agent
  const hrAgent = await prisma.user.upsert({
    where: { email: 'hr.agent@default.com' },
    update: {},
    create: {
      email: 'hr.agent@default.com',
      password: agentPasswordHash,
      name: 'HR Agent',
      role: UserRole.AGENT,
      tenantId: tenant.id,
    },
  })

  // Sales Agent
  const salesAgent = await prisma.user.upsert({
    where: { email: 'sales.agent@default.com' },
    update: {},
    create: {
      email: 'sales.agent@default.com',
      password: agentPasswordHash,
      name: 'Sales Agent',
      role: UserRole.AGENT,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Agent users created')

  // Regular users
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@default.com' },
    update: {},
    create: {
      email: 'user1@default.com',
      password: userPasswordHash,
      name: 'John Doe',
      role: UserRole.USER,
      tenantId: tenant.id,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@default.com' },
    update: {},
    create: {
      email: 'user2@default.com',
      password: userPasswordHash,
      name: 'Jane Smith',
      role: UserRole.USER,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Regular users created')

  // 4. Assign agents to departments
  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: itAgent.id,
        departmentId: itDepartment.id,
      },
    },
    update: {},
    create: {
      userId: itAgent.id,
      departmentId: itDepartment.id,
    },
  })

  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: hrAgent.id,
        departmentId: hrDepartment.id,
      },
    },
    update: {},
    create: {
      userId: hrAgent.id,
      departmentId: hrDepartment.id,
    },
  })

  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: salesAgent.id,
        departmentId: salesDepartment.id,
      },
    },
    update: {},
    create: {
      userId: salesAgent.id,
      departmentId: salesDepartment.id,
    },
  })

  // Admin can be in all departments (optional, for testing)
  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: admin.id,
        departmentId: itDepartment.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      departmentId: itDepartment.id,
    },
  })

  console.log('✅ Agents assigned to departments')

  // 5. Create sample tickets with various statuses and dates for analytics
  const now = new Date()
  
  // Helper to create ticket with specific dates using raw SQL
  const createTicketWithDates = async (
    subject: string,
    description: string,
    priority: string,
    status: string,
    requesterId: string,
    assigneeId: string | null,
    departmentId: string,
    createdAt: Date,
    updatedAt: Date
  ) => {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "Ticket" (id, subject, description, priority, status, "tenantId", "requesterId", "assigneeId", "departmentId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${subject}, ${description}, ${priority}::"TicketPriority", ${status}::"TicketStatus", ${tenant.id}, ${requesterId}, ${assigneeId}, ${departmentId}, ${createdAt}::timestamp, ${updatedAt}::timestamp)
    `)
  }

  // Current month - resolved tickets (IT)
  for (let i = 0; i < 5; i++) {
    const daysAgo = i * 2
    const createdAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo)
    createdAt.setHours(10, 0, 0, 0)
    const resolutionHours = Math.floor(Math.random() * 48 + 2) // 2-50 hours
    const updatedAt = new Date(createdAt.getTime() + resolutionHours * 60 * 60 * 1000)
    
    await createTicketWithDates(
      `IT Issue ${i + 1}`,
      `Sample IT support ticket ${i + 1}`,
      ['LOW', 'MEDIUM', 'HIGH'][i % 3],
      'RESOLVED',
      user1.id,
      itAgent.id,
      itDepartment.id,
      createdAt,
      updatedAt
    )
  }

  // Previous month - resolved tickets (HR)
  for (let i = 0; i < 4; i++) {
    const createdAt = new Date(now.getFullYear(), now.getMonth() - 1, 15 + i)
    createdAt.setHours(14, 0, 0, 0)
    const resolutionHours = Math.floor(Math.random() * 72 + 4) // 4-76 hours
    const updatedAt = new Date(createdAt.getTime() + resolutionHours * 60 * 60 * 1000)
    
    await createTicketWithDates(
      `HR Request ${i + 1}`,
      `Sample HR request ${i + 1}`,
      ['LOW', 'MEDIUM'][i % 2],
      'RESOLVED',
      user2.id,
      hrAgent.id,
      hrDepartment.id,
      createdAt,
      updatedAt
    )
  }

  // Sales department tickets - closed
  for (let i = 0; i < 3; i++) {
    const daysAgo = i * 3
    const createdAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo)
    createdAt.setHours(9, 0, 0, 0)
    const resolutionHours = Math.floor(Math.random() * 24 + 1) // 1-25 hours
    const updatedAt = new Date(createdAt.getTime() + resolutionHours * 60 * 60 * 1000)
    
    await createTicketWithDates(
      `Sales Inquiry ${i + 1}`,
      `Sample sales inquiry ${i + 1}`,
      ['MEDIUM', 'HIGH'][i % 2],
      'CLOSED',
      user1.id,
      salesAgent.id,
      salesDepartment.id,
      createdAt,
      updatedAt
    )
  }

  // More IT tickets with admin assignee
  for (let i = 0; i < 3; i++) {
    const createdAt = new Date(now.getFullYear(), now.getMonth() - 1, 20 + i)
    createdAt.setHours(11, 0, 0, 0)
    const resolutionHours = Math.floor(Math.random() * 96 + 8) // 8-104 hours
    const updatedAt = new Date(createdAt.getTime() + resolutionHours * 60 * 60 * 1000)
    
    await createTicketWithDates(
      `IT Support ${i + 1}`,
      `Sample IT support ticket ${i + 1}`,
      ['MEDIUM', 'HIGH', 'URGENT'][i % 3],
      'RESOLVED',
      user2.id,
      admin.id,
      itDepartment.id,
      createdAt,
      updatedAt
    )
  }

  // Also create some open tickets for the dashboard
  const ticket1 = await prisma.ticket.create({
    data: {
      subject: 'Computer not starting',
      description: 'My computer won\'t turn on. The power button does nothing.',
      priority: 'HIGH',
      status: 'OPEN',
      tenantId: tenant.id,
      requesterId: user1.id,
      departmentId: itDepartment.id,
    },
  })

  const ticket2 = await prisma.ticket.create({
    data: {
      subject: 'Need password reset',
      description: 'I forgot my password and need it reset.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      tenantId: tenant.id,
      requesterId: user2.id,
      departmentId: itDepartment.id,
      assigneeId: itAgent.id,
    },
  })

  const ticket3 = await prisma.ticket.create({
    data: {
      subject: 'Vacation request',
      description: 'I would like to request vacation days for next month.',
      priority: 'LOW',
      status: 'OPEN',
      tenantId: tenant.id,
      requesterId: user1.id,
      departmentId: hrDepartment.id,
    },
  })

  console.log('✅ Sample tickets created (including resolved/closed tickets for analytics)')

  console.log('\n📊 Seed Summary:')
  console.log(`   - Tenant: ${tenant.name}`)
  console.log(`   - Departments: 3 (IT Support, HR, Sales)`)
  console.log(`   - Users: 1 Admin, 3 Agents, 2 Regular Users`)
  console.log(`   - Tickets: 18 total (15 resolved/closed for analytics, 3 open/in-progress)`)
  console.log('\n✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
