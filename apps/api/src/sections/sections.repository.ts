import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SectionCreateInput) {
    return this.prisma.section.create({
      data,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
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
      },
    });
  }

  async findAll(
    departmentId: string,
    tenantId: string,
    opts?: { page?: number; limit?: number },
  ): Promise<any[] | { data: any[]; total: number }> {
    const where = {
      departmentId,
      department: { tenantId },
    };
    const include = {
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
          members: true,
        },
      },
    };
    if (opts?.page != null && opts?.limit != null) {
      const total = await this.prisma.section.count({ where });
      const data = await this.prisma.section.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        include,
        orderBy: { name: 'asc' },
      });
      return { data, total };
    }
    return this.prisma.section.findMany({
      where,
      include,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    return this.prisma.section.findFirst({
      where: {
        id,
        department: {
          tenantId,
        },
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
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
      },
    });
  }

  async update(id: string, tenantId: string, data: Prisma.SectionUpdateInput) {
    return this.prisma.section.update({
      where: {
        id,
      },
      data,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        },
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
      },
    });
  }

  async delete(id: string, tenantId: string) {
    return this.prisma.section.delete({
      where: {
        id,
      },
    });
  }

  async addUser(sectionId: string, userId: string, tenantId: string) {
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

    // Verify section belongs to tenant
    const section = await this.prisma.section.findFirst({
      where: {
        id: sectionId,
        department: {
          tenantId,
        },
      },
    });

    if (!section) {
      return null;
    }

    return this.prisma.userSection.upsert({
      where: {
        userId_sectionId: {
          userId,
          sectionId,
        },
      },
      create: {
        userId,
        sectionId,
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
        section: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                tenantId: true,
              },
            },
          },
        },
      },
    });
  }

  async removeUser(sectionId: string, userId: string, tenantId: string) {
    // Verify section belongs to tenant
    const section = await this.prisma.section.findFirst({
      where: {
        id: sectionId,
        department: {
          tenantId,
        },
      },
    });

    if (!section) {
      return null;
    }

    return this.prisma.userSection.delete({
      where: {
        userId_sectionId: {
          userId,
          sectionId,
        },
      },
    });
  }

  async findUserSections(userId: string, tenantId: string) {
    return this.prisma.userSection.findMany({
      where: {
        userId,
        section: {
          department: {
            tenantId,
          },
        },
      },
      include: {
        section: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                tenantId: true,
              },
            },
          },
        },
      },
    });
  }
}
