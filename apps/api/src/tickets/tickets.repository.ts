import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TicketStatus, TicketPriority } from '@prisma/client';

@Injectable()
export class TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TicketCreateInput) {
    return this.prisma.ticket.create({
      data,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string, filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string;
    requesterId?: string;
  }) {
    const where: Prisma.TicketWhereInput = {
      tenantId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
      ...(filters?.requesterId && { requesterId: filters.requesterId }),
    };

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Load attachments separately to avoid Prisma client sync issues
    // This will be optimized once Prisma client is regenerated
    const ticketsWithAttachments = await Promise.all(
      tickets.map(async (ticket) => {
        try {
          const attachments = await this.prisma.ticketAttachment.findMany({
            where: { ticketId: ticket.id },
            select: {
              id: true,
              filename: true,
              mimeType: true,
              size: true,
              isImage: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
          return { ...ticket, attachments };
        } catch {
          return { ...ticket, attachments: [] };
        }
      }),
    );

    return ticketsWithAttachments;
  }

  async findOne(id: string, tenantId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!ticket) {
      return null;
    }

    // Load attachments separately to avoid Prisma client sync issues
    try {
      const attachments = await this.prisma.ticketAttachment.findMany({
        where: { ticketId: ticket.id },
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
      return { ...ticket, attachments };
    } catch {
      return { ...ticket, attachments: [] };
    }
  }

  async update(id: string, tenantId: string, data: Prisma.TicketUpdateInput) {
    return this.prisma.ticket.update({
      where: {
        id,
        tenantId,
      },
      data,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    return this.prisma.ticket.delete({
      where: {
        id,
        tenantId,
      },
    });
  }

  async assign(id: string, tenantId: string, assigneeId: string) {
    return this.prisma.ticket.update({
      where: {
        id,
        tenantId,
      },
      data: {
        assigneeId,
        // Auto-update status to IN_PROGRESS when assigned
        status: TicketStatus.IN_PROGRESS,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}

