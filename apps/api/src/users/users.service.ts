import { Injectable, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import type { CreateUserDTO } from '@tcc/schemas';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(data: CreateUserDTO) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  findAll() {
    return this.usersRepository.findAll();
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

}
