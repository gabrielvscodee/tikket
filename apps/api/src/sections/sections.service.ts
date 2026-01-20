import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SectionsRepository } from './sections.repository';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateSectionDTO,
  UpdateSectionDTO,
  AddUserToSectionDTO,
  RemoveUserFromSectionDTO,
} from '@tcc/schemas';
import { UserRole } from '@prisma/client';

@Injectable()
export class SectionsService {
  constructor(
    private readonly sectionsRepository: SectionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(data: CreateSectionDTO, tenantId: string, userId: string, userRole: UserRole) {
    // Verify department exists and belongs to tenant
    const department = await this.prisma.department.findFirst({
      where: {
        id: data.departmentId,
        tenantId,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // If user is SUPERVISOR, verify they belong to the department
    if (userRole === UserRole.SUPERVISOR) {
      const userDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: data.departmentId,
        },
      });

      if (!userDepartment) {
        throw new ForbiddenException('You can only create sections in your own department');
      }
    }

    return this.sectionsRepository.create({
      name: data.name,
      description: data.description,
      department: {
        connect: { id: data.departmentId },
      },
    });
  }

  async findAll(departmentId: string, tenantId: string) {
    // Verify department exists
    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return this.sectionsRepository.findAll(departmentId, tenantId);
  }

  async findOne(id: string, tenantId: string) {
    const section = await this.sectionsRepository.findOne(id, tenantId);

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return section;
  }

  async update(id: string, tenantId: string, data: UpdateSectionDTO, userId: string, userRole: UserRole) {
    const section = await this.findOne(id, tenantId);

    // If user is SUPERVISOR, verify they belong to the department
    if (userRole === UserRole.SUPERVISOR) {
      const userDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: section.department.id,
        },
      });

      if (!userDepartment) {
        throw new ForbiddenException('You can only update sections in your own department');
      }
    }

    return this.sectionsRepository.update(id, tenantId, {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    });
  }

  async delete(id: string, tenantId: string, userId: string, userRole: UserRole) {
    const section = await this.findOne(id, tenantId);

    // If user is SUPERVISOR, verify they belong to the department
    if (userRole === UserRole.SUPERVISOR) {
      const userDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: section.department.id,
        },
      });

      if (!userDepartment) {
        throw new ForbiddenException('You can only delete sections in your own department');
      }
    }

    return this.sectionsRepository.delete(id, tenantId);
  }

  async addUser(id: string, tenantId: string, data: AddUserToSectionDTO, userId: string, userRole: UserRole) {
    const section = await this.findOne(id, tenantId);

    // If user is SUPERVISOR, verify they belong to the department
    if (userRole === UserRole.SUPERVISOR) {
      const userDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: section.department.id,
        },
      });

      if (!userDepartment) {
        throw new ForbiddenException('You can only add users to sections in your own department');
      }
    }

    const result = await this.sectionsRepository.addUser(id, data.userId, tenantId);

    if (!result) {
      throw new BadRequestException('User or section not found');
    }

    return result;
  }

  async removeUser(id: string, tenantId: string, data: RemoveUserFromSectionDTO, userId: string, userRole: UserRole) {
    const section = await this.findOne(id, tenantId);

    // If user is SUPERVISOR, verify they belong to the department
    if (userRole === UserRole.SUPERVISOR) {
      const userDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: section.department.id,
        },
      });

      if (!userDepartment) {
        throw new ForbiddenException('You can only remove users from sections in your own department');
      }
    }

    const result = await this.sectionsRepository.removeUser(id, data.userId, tenantId);

    if (!result) {
      throw new NotFoundException('User not found in section');
    }

    return result;
  }

  async getSectionMembers(id: string, tenantId: string) {
    const section = await this.findOne(id, tenantId);

    const members = await this.prisma.userSection.findMany({
      where: {
        sectionId: id,
        section: {
          department: {
            tenantId,
          },
        },
      },
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
    });

    return members.map((m) => m.user);
  }
}
