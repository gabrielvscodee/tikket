import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TicketsRepository } from './tickets.repository';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTicketDTO, UpdateTicketDTO, AssignTicketDTO } from '@tcc/schemas';
import { TicketStatus, TicketPriority, UserRole } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(data: CreateTicketDTO, tenantId: string, requesterId: string) {
    // Verify requester exists and belongs to tenant
    const requester = await this.prisma.user.findFirst({
      where: {
        id: requesterId,
        tenantId,
      },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

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

    return this.ticketsRepository.create({
      subject: data.subject,
      description: data.description,
      priority: data.priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      tenant: {
        connect: { id: tenantId },
      },
      requester: {
        connect: { id: requesterId },
      },
      department: {
        connect: { id: data.departmentId },
      },
    });
  }

  findAll(tenantId: string, filters?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string;
    requesterId?: string;
    departmentId?: string;
    departmentIds?: string[];
  }) {
    return this.ticketsRepository.findAll(tenantId, filters);
  }

  async findOne(id: string, tenantId: string) {
    const ticket = await this.ticketsRepository.findOne(id, tenantId);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateTicketDTO,
    userId: string,
    userRole: UserRole,
  ) {
    const ticket = await this.findOne(id, tenantId);

    // Users can only update their own tickets, unless they're agents/admins
    if (userRole === UserRole.USER && ticket.requesterId !== userId) {
      throw new ForbiddenException('You can only update your own tickets');
    }

    // Only agents/admins can change status and assignee
    if (data.status && userRole === UserRole.USER) {
      throw new ForbiddenException('Only agents and admins can change ticket status');
    }

    if (data.assigneeId !== undefined && userRole === UserRole.USER) {
      throw new ForbiddenException('Only agents and admins can assign tickets');
    }

    // If assigning, verify assignee exists and is an agent/admin
    if (data.assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: {
          id: data.assigneeId,
          tenantId,
          role: {
            in: [UserRole.ADMIN, UserRole.AGENT],
          },
        },
      });

      if (!assignee) {
        throw new BadRequestException('Assignee must be an agent or admin');
      }

      // If ticket has a department, verify assignee belongs to that department (unless admin)
      if (ticket.departmentId && userRole !== UserRole.ADMIN) {
        const userInDepartment = await this.prisma.userDepartment.findFirst({
          where: {
            userId: data.assigneeId,
            departmentId: ticket.departmentId,
          },
        });

        if (!userInDepartment) {
          throw new BadRequestException('Assignee must belong to the ticket\'s department');
        }
      }
    }

    // If changing department, verify it exists and belongs to tenant
    if (data.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: {
          id: data.departmentId,
          tenantId,
        },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }

      // Only agents/admins can change department
      if (userRole === UserRole.USER) {
        throw new ForbiddenException('Only agents and admins can change ticket department');
      }
    }

    return this.ticketsRepository.update(id, tenantId, {
      ...(data.subject && { subject: data.subject }),
      ...(data.description && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.priority && { priority: data.priority }),
      ...(data.assigneeId !== undefined && {
        assigneeId: data.assigneeId || null,
        // Auto-update status when assigning
        ...(data.assigneeId && { status: TicketStatus.IN_PROGRESS }),
      }),
      ...(data.departmentId && {
        department: {
          connect: { id: data.departmentId },
        },
      }),
    });
  }

  async assign(id: string, tenantId: string, data: AssignTicketDTO, userRole: UserRole) {
    // Only agents/admins can assign tickets
    if (userRole === UserRole.USER) {
      throw new ForbiddenException('Only agents and admins can assign tickets');
    }

    const ticket = await this.findOne(id, tenantId);

    // Verify assignee exists and is an agent/admin
    const assignee = await this.prisma.user.findFirst({
      where: {
        id: data.assigneeId,
        tenantId,
        role: {
          in: [UserRole.ADMIN, UserRole.AGENT],
        },
      },
    });

    if (!assignee) {
      throw new BadRequestException('Assignee must be an agent or admin');
    }

    // Verify assignee belongs to ticket's department (unless admin)
    if (userRole !== UserRole.ADMIN) {
      const userInDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId: data.assigneeId,
          departmentId: ticket.departmentId,
        },
      });

      if (!userInDepartment) {
        throw new BadRequestException('Assignee must belong to the ticket\'s department');
      }
    }

    return this.ticketsRepository.assign(id, tenantId, data.assigneeId);
  }

  async delete(id: string, tenantId: string, userId: string, userRole: UserRole) {
    const ticket = await this.findOne(id, tenantId);

    // Only admins can delete tickets, or users can delete their own
    if (userRole === UserRole.USER && ticket.requesterId !== userId) {
      throw new ForbiddenException('You can only delete your own tickets');
    }

    if (userRole === UserRole.AGENT && ticket.requesterId !== userId) {
      throw new ForbiddenException('Agents can only delete their own tickets');
    }

    return this.ticketsRepository.delete(id, tenantId);
  }
}
