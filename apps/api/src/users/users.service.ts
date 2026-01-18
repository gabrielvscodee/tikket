import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDTO, UpdateUserDTO } from '@tcc/schemas';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(data: CreateUserDTO, tenantId: string) {
    // Use role from DTO if provided, otherwise default to USER
    const userRole = data.role || 'USER';
    // Check if user already exists in this tenant
    const existingUser = await this.usersRepository.findByEmailAndTenant(data.email, tenantId);
    
    if (existingUser) {
      throw new ConflictException('User already exists in this tenant');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.usersRepository.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: userRole,
      tenant: {
        connect: { id: tenantId },
      },
    });
  }

  findAll(tenantId: string) {
    return this.usersRepository.findAll(tenantId);
  }

  async findByEmail(email: string, tenantId?: string) {
    return this.usersRepository.findByEmail(email, tenantId);
  }

  async findByEmailAndTenant(email: string, tenantId: string) {
    return this.usersRepository.findByEmailAndTenant(email, tenantId);
  }

  async findById(id: string, tenantId: string) {
    return this.usersRepository.findById(id, tenantId);
  }

  async findByIdWithTickets(id: string, tenantId: string) {
    return this.usersRepository.findByIdWithTickets(id, tenantId);
  }

  async updateProfile(
    id: string,
    tenantId: string,
    data: { name?: string; email?: string; password?: string; currentPassword?: string },
  ) {
    const user = await this.usersRepository.findById(id, tenantId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // If changing password, verify current password
    if (data.password) {
      if (!data.currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }
      const passwordValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!passwordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.email) {
      // Check if email is already taken by another user in the tenant
      const existingUser = await this.usersRepository.findByEmailAndTenant(data.email, tenantId);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already taken');
      }
      updateData.email = data.email;
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.usersRepository.update(id, tenantId, updateData);
  }

  async update(id: string, tenantId: string, data: UpdateUserDTO) {
    const user = await this.usersRepository.findById(id, tenantId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.disabled !== undefined) {
      updateData.disabled = data.disabled;
    }

    // Update user basic fields
    const updatedUser = await this.usersRepository.update(id, tenantId, updateData);

    // Handle department updates if provided
    if (data.departmentIds !== undefined) {
      // Verify all departments belong to the tenant
      const departments = await this.prisma.department.findMany({
        where: {
          id: { in: data.departmentIds },
          tenantId,
        },
      });

      if (departments.length !== data.departmentIds.length) {
        throw new BadRequestException('One or more departments not found or do not belong to tenant');
      }

      // Remove all existing department associations
      await this.prisma.userDepartment.deleteMany({
        where: {
          userId: id,
        },
      });

      // Add new department associations
      if (data.departmentIds.length > 0) {
        await this.prisma.userDepartment.createMany({
          data: data.departmentIds.map((deptId) => ({
            userId: id,
            departmentId: deptId,
          })),
        });
      }
    }

    // Return updated user with departments
    return this.usersRepository.findByIdWithTickets(id, tenantId);
  }
}
