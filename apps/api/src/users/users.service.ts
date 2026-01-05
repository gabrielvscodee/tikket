import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import type { CreateUserDTO } from '@tcc/schemas';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(data: CreateUserDTO, tenantId: string, role: 'ADMIN' | 'AGENT' | 'USER' = 'USER') {
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
      role,
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
}
