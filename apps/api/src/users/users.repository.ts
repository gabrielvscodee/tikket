import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      include: {
        departments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  async findByEmail(email: string, tenantId?: string) {
    if (tenantId) {
      return this.prisma.user.findFirst({
        where: {
          email,
          tenantId,
        },
      });
    }
    // For login, we need to find by email across tenants
    // but this should be used carefully
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailAndTenant(email: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
    });
  }

  async findDefaultTenant() {
    return this.prisma.tenant.findUnique({
      where: { slug: 'default' },
    });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
    });
  }

  async findByIdWithTickets(id: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        requestedTickets: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        assignedTickets: {
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        departments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, tenantId: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: {
        id,
        tenantId,
      },
      data,
    });
  }
}
