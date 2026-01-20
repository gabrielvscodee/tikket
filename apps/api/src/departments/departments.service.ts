import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDepartmentDTO, UpdateDepartmentDTO, AddUserToDepartmentDTO, RemoveUserFromDepartmentDTO } from '@tcc/schemas';
import { UserRole } from '@prisma/client';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(data: CreateDepartmentDTO, tenantId: string) {
    return this.departmentsRepository.create({
      name: data.name,
      description: data.description,
      tenant: {
        connect: { id: tenantId },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.departmentsRepository.findAll(tenantId);
  }

  async findOne(id: string, tenantId: string) {
    const department = await this.departmentsRepository.findOne(id, tenantId);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async update(id: string, tenantId: string, data: UpdateDepartmentDTO, userId?: string, userRole?: UserRole) {
    const department = await this.findOne(id, tenantId);

    // If user is SUPERVISOR, verify they belong to the department
    if (userRole === UserRole.SUPERVISOR && userId) {
      const userDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: id,
        },
      });

      if (!userDepartment) {
        throw new ForbiddenException('You can only update your own department');
      }
    }

    return this.departmentsRepository.update(id, tenantId, {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    });
  }

  async delete(id: string, tenantId: string) {
    const department = await this.findOne(id, tenantId);

    // Check if department has tickets
    const ticketCount = await this.prisma.ticket.count({
      where: {
        departmentId: id,
        tenantId,
      },
    });

    if (ticketCount > 0) {
      throw new BadRequestException('Cannot delete department with existing tickets');
    }

    return this.departmentsRepository.delete(id, tenantId);
  }

  async addUser(id: string, tenantId: string, data: AddUserToDepartmentDTO, userId?: string, userRole?: UserRole) {
    const department = await this.findOne(id, tenantId);

    // If user is SUPERVISOR, verify they belong to the department
    if (userRole === UserRole.SUPERVISOR && userId) {
      const userDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: id,
        },
      });

      if (!userDepartment) {
        throw new ForbiddenException('You can only add users to your own department');
      }
    }

    const result = await this.departmentsRepository.addUser(id, data.userId, tenantId);

    if (!result) {
      throw new BadRequestException('User or department not found');
    }

    return result;
  }

  async removeUser(id: string, tenantId: string, data: RemoveUserFromDepartmentDTO, userId?: string, userRole?: UserRole) {
    const department = await this.findOne(id, tenantId);

    // If user is SUPERVISOR, verify they belong to the department
    if (userRole === UserRole.SUPERVISOR && userId) {
      const userDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId,
          departmentId: id,
        },
      });

      if (!userDepartment) {
        throw new ForbiddenException('You can only remove users from your own department');
      }
    }

    const result = await this.departmentsRepository.removeUser(id, data.userId, tenantId);

    if (!result) {
      throw new NotFoundException('User not found in department');
    }

    return result;
  }

  async getUserDepartments(userId: string, tenantId: string) {
    return this.departmentsRepository.findUserDepartments(userId, tenantId);
  }

  async getDepartmentMembers(id: string, tenantId: string) {
    const department = await this.findOne(id, tenantId);
    
    const members = await this.prisma.userDepartment.findMany({
      where: {
        departmentId: id,
        department: {
          tenantId,
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

    return members.map(m => m.user);
  }
}
