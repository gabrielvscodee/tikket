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
    const requester = await this.prisma.user.findFirst({
      where: {
        id: requesterId,
        tenantId,
      },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    const department = await this.prisma.department.findFirst({
      where: {
        id: data.departmentId,
        tenantId,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // If sectionId is provided, validate it belongs to the department
    if (data.sectionId) {
      const section = await this.prisma.section.findFirst({
        where: {
          id: data.sectionId,
          departmentId: data.departmentId,
        },
      });

      if (!section) {
        throw new BadRequestException('Section must belong to the selected department');
      }
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
      ...(data.sectionId && {
        section: {
          connect: { id: data.sectionId },
        },
      }),
    });
  }

  findAll(
    tenantId: string,
    filters?: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assigneeId?: string;
      requesterId?: string;
      departmentId?: string;
      departmentIds?: string[];
      sectionIds?: string[];
      userId?: string;
    },
    opts?: { page?: number; limit?: number; search?: string; createdIn?: string },
  ) {
    return this.ticketsRepository.findAll(tenantId, filters, opts);
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

    if (userRole === UserRole.USER && ticket.requesterId !== userId) {
      throw new ForbiddenException('You can only update your own tickets');
    }

    if (data.status && userRole === UserRole.USER) {
      throw new ForbiddenException('Only agents and admins can change ticket status');
    }

    if (data.priority && userRole === UserRole.USER) {
      throw new ForbiddenException('Only agents and admins can change ticket priority');
    }

    if (data.assigneeId !== undefined && userRole === UserRole.USER) {
      throw new ForbiddenException('Only agents and admins can assign tickets');
    }

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

      if (userRole === UserRole.USER) {
        throw new ForbiddenException('Only agents and admins can change ticket department');
      }
    }

    // If sectionId is provided, validate it belongs to the department (either new or existing)
    const targetDepartmentId = data.departmentId || ticket.departmentId;
    if (data.sectionId && targetDepartmentId) {
      const section = await this.prisma.section.findFirst({
        where: {
          id: data.sectionId,
          departmentId: targetDepartmentId,
        },
      });

      if (!section) {
        throw new BadRequestException('Section must belong to the ticket\'s department');
      }
    }

    return this.ticketsRepository.update(id, tenantId, {
      ...(data.subject && { subject: data.subject }),
      ...(data.description && { description: data.description }),
      ...(data.status && { status: data.status }),
      ...(data.priority && { priority: data.priority }),
      ...(data.assigneeId !== undefined && {
        assigneeId: data.assigneeId || null,
        ...(data.assigneeId && { status: TicketStatus.IN_PROGRESS }),
      }),
      ...(data.departmentId && {
        department: {
          connect: { id: data.departmentId },
        },
      }),
      ...(data.sectionId !== undefined && {
        section: data.sectionId ? { connect: { id: data.sectionId } } : { disconnect: true },
      }),
    });
  }

  async assign(id: string, tenantId: string, data: AssignTicketDTO, userRole: UserRole) {
    if (userRole === UserRole.USER) {
      throw new ForbiddenException('Only agents and admins can assign tickets');
    }

    const ticket = await this.findOne(id, tenantId);

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

    if (userRole === UserRole.USER && ticket.requesterId !== userId) {
      throw new ForbiddenException('You can only delete your own tickets');
    }

    if (userRole === UserRole.AGENT && ticket.requesterId !== userId) {
      throw new ForbiddenException('Agents can only delete their own tickets');
    }

    return this.ticketsRepository.delete(id, tenantId);
  }

  async getAnalytics(
    tenantId: string,
    period: 'YEAR' | 'SEMIANNUAL' | 'BIMONTHLY' | 'MONTHLY' | undefined,
    userRole: UserRole,
    userId: string,
    startDate?: string,
    endDate?: string,
    viewMode?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY',
  ) {
    let departmentIds: string[] | undefined;

    if (userRole === UserRole.AGENT) {
      const userDepartments = await this.prisma.userDepartment.findMany({
        where: {
          userId,
          department: {
            tenantId,
          },
        },
        select: {
          departmentId: true,
        },
      });

      departmentIds = userDepartments.map(ud => ud.departmentId);
      
      if (departmentIds.length === 0) {
        return {
          general: [],
          byPerson: [],
          byDepartment: [],
          averageResolutionTime: 0,
          averagePerPerson: [],
          averagePerDepartment: [],
        };
      }
    }

    return this.ticketsRepository.getAnalytics(tenantId, period, departmentIds, startDate, endDate, viewMode);
  }

  /**
   * Auto-close tickets that have been RESOLVED for 7 days
   * This should be called periodically (e.g., via a cron job)
   */
  async autoCloseResolvedTickets(tenantId?: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const where: any = {
      status: TicketStatus.RESOLVED,
      updatedAt: {
        lte: sevenDaysAgo,
      },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const result = await this.prisma.ticket.updateMany({
      where,
      data: {
        status: TicketStatus.CLOSED,
      },
    });

    return result;
  }
}
