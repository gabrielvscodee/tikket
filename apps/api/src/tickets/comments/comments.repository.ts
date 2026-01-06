import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TicketCommentCreateInput) {
    return this.prisma.ticketComment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        ticket: {
          select: {
            id: true,
            subject: true,
            status: true,
          },
        },
      },
    });
  }

  findAll(ticketId: string, tenantId: string, includeInternal: boolean = false) {
    const where: Prisma.TicketCommentWhereInput = {
      ticketId,
      tenantId,
      ...(includeInternal ? {} : { isInternal: false }),
    };

    return this.prisma.ticketComment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  findOne(id: string, tenantId: string) {
    return this.prisma.ticketComment.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        ticket: {
          select: {
            id: true,
            subject: true,
            status: true,
          },
        },
      },
    });
  }

  async update(id: string, tenantId: string, data: Prisma.TicketCommentUpdateInput) {
    return this.prisma.ticketComment.update({
      where: {
        id,
        tenantId,
      },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        ticket: {
          select: {
            id: true,
            subject: true,
            status: true,
          },
        },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    return this.prisma.ticketComment.delete({
      where: {
        id,
        tenantId,
      },
    });
  }
}

