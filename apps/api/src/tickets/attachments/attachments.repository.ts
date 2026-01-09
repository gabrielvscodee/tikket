import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TicketAttachmentCreateInput) {
    return this.prisma.ticketAttachment.create({
      data,
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        isImage: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });
  }

  async findByTicket(ticketId: string, tenantId: string) {
    return this.prisma.ticketAttachment.findMany({
      where: {
        ticketId,
        ticket: {
          tenantId,
        },
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        isImage: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, tenantId: string, includeData: boolean = false) {
    return this.prisma.ticketAttachment.findFirst({
      where: {
        id,
        ticket: {
          tenantId,
        },
      },
      select: {
        id: true,
        ticketId: true,
        filename: true,
        mimeType: true,
        size: true,
        isImage: true,
        ...(includeData && { data: true }),
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdAt: true,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    return this.prisma.ticketAttachment.deleteMany({
      where: {
        id,
        ticket: {
          tenantId,
        },
      },
    });
  }

  async deleteByTicket(ticketId: string, tenantId: string) {
    return this.prisma.ticketAttachment.deleteMany({
      where: {
        ticketId,
        ticket: {
          tenantId,
        },
      },
    });
  }
}
