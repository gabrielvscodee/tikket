import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(data: { email: string; name?: string }) {
    return this.prisma.user.create({ data })
  }

  findAll() {
    return this.prisma.user.findMany()
  }
}
