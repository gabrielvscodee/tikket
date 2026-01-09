import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.DepartmentCreateInput) {
    return this.prisma.department.create({
      data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.department.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });
  }

  async update(id: string, tenantId: string, data: Prisma.DepartmentUpdateInput) {
    return this.prisma.department.update({
      where: {
        id,
        tenantId,
      },
      data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    return this.prisma.department.delete({
      where: {
        id,
        tenantId,
      },
    });
  }

  async addUser(departmentId: string, userId: string, tenantId: string) {
    // Verify user belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      return null;
    }

    // Verify department belongs to tenant
    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId,
      },
    });

    if (!department) {
      return null;
    }

    return this.prisma.userDepartment.upsert({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
      create: {
        userId,
        departmentId,
      },
      update: {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        department: true,
      },
    });
  }

  async removeUser(departmentId: string, userId: string, tenantId: string) {
    // Verify department belongs to tenant
    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId,
      },
    });

    if (!department) {
      return null;
    }

    return this.prisma.userDepartment.delete({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    });
  }

  async findUserDepartments(userId: string, tenantId: string) {
    return this.prisma.userDepartment.findMany({
      where: {
        userId,
        department: {
          tenantId,
        },
      },
      include: {
        department: true,
      },
    });
  }
}
