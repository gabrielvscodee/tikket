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
        department: {
          select: {
            id: true,
            name: true,
            description: true,
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
    departmentId?: string;
    departmentIds?: string[];
  }) {
    const where: Prisma.TicketWhereInput = {
      tenantId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
      ...(filters?.requesterId && { requesterId: filters.requesterId }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
      ...(filters?.departmentIds && { departmentId: { in: filters.departmentIds } }),
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
        department: {
          select: {
            id: true,
            name: true,
            description: true,
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
        department: {
          select: {
            id: true,
            name: true,
            description: true,
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
        department: {
          select: {
            id: true,
            name: true,
            description: true,
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
        department: {
          select: {
            id: true,
            name: true,
            description: true,
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

  async getAnalytics(
    tenantId: string,
    period: 'YEAR' | 'SEMIANNUAL' | 'BIMONTHLY' | 'MONTHLY' | undefined,
    departmentIds?: string[],
    startDateStr?: string,
    endDateStr?: string,
    viewMode?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY',
  ) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let viewModeToUse: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY' = 'MONTHLY';

    // If startDate and endDate are provided, use them
    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      // Set endDate to end of day
      endDate.setHours(23, 59, 59, 999);
      // Use provided viewMode or default based on date range
      if (viewMode) {
        viewModeToUse = viewMode;
      } else {
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 30) {
          viewModeToUse = 'DAILY';
        } else if (daysDiff <= 90) {
          viewModeToUse = 'WEEKLY';
        } else if (daysDiff <= 180) {
          viewModeToUse = 'MONTHLY';
        } else if (daysDiff <= 365) {
          viewModeToUse = 'BIMONTHLY';
        } else if (daysDiff <= 730) {
          viewModeToUse = 'QUARTERLY';
        } else {
          viewModeToUse = 'YEARLY';
        }
      }
    } else if (period) {
      // Calculate start date based on period (backward compatibility)
      switch (period) {
        case 'YEAR':
          startDate = new Date(now.getFullYear(), 0, 1);
          viewModeToUse = 'MONTHLY';
          break;
        case 'SEMIANNUAL':
          const currentMonth = now.getMonth();
          const semesterStart = currentMonth < 6 ? 0 : 6;
          startDate = new Date(now.getFullYear(), semesterStart, 1);
          viewModeToUse = 'MONTHLY';
          break;
        case 'BIMONTHLY':
          const bimonthStart = Math.floor(now.getMonth() / 2) * 2;
          startDate = new Date(now.getFullYear(), bimonthStart, 1);
          viewModeToUse = 'MONTHLY';
          break;
        case 'MONTHLY':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          viewModeToUse = 'DAILY';
          break;
        default:
          startDate = new Date(now.getFullYear(), 0, 1);
          viewModeToUse = 'MONTHLY';
      }
    } else {
      // Default to last month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      viewModeToUse = 'DAILY';
    }

    const where: Prisma.TicketWhereInput = {
      tenantId,
      status: {
        in: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
      },
      updatedAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(departmentIds && departmentIds.length > 0 && { departmentId: { in: departmentIds } }),
    };

    // Get all resolved/closed tickets
    const resolvedTickets = await this.prisma.ticket.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate resolution times
    const ticketsWithResolutionTime = resolvedTickets.map(ticket => {
      const resolutionTime = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
      return {
        ...ticket,
        resolutionTimeMs: resolutionTime,
        resolutionTimeHours: resolutionTime / (1000 * 60 * 60),
      };
    });

    // Group by time period for general graph based on viewMode
    const generalData = new Map<string, number>();
    ticketsWithResolutionTime.forEach(ticket => {
      const date = new Date(ticket.updatedAt);
      let key: string;
      
      switch (viewModeToUse) {
        case 'DAILY':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'WEEKLY':
          // Get week start (Monday)
          const weekStart = new Date(date);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
          weekStart.setDate(diff);
          key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'MONTHLY':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'BIMONTHLY':
          const bimonth = Math.floor(date.getMonth() / 2) * 2;
          key = `${date.getFullYear()}-${String(bimonth + 1).padStart(2, '0')}-${String(bimonth + 2).padStart(2, '0')}`;
          break;
        case 'QUARTERLY':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'YEARLY':
          key = `${date.getFullYear()}`;
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      generalData.set(key, (generalData.get(key) || 0) + 1);
    });

    // Group by person
    const byPerson = new Map<string, { name: string; count: number; totalTime: number; tickets: number }>();
    ticketsWithResolutionTime.forEach(ticket => {
      if (!ticket.assigneeId) return;
      const personId = ticket.assigneeId;
      const personName = ticket.assignee?.name || ticket.assignee?.email || 'Unknown';
      
      if (!byPerson.has(personId)) {
        byPerson.set(personId, { name: personName, count: 0, totalTime: 0, tickets: 0 });
      }
      
      const personData = byPerson.get(personId)!;
      personData.count += 1;
      personData.totalTime += ticket.resolutionTimeHours;
      personData.tickets += 1;
    });

    // Group by department
    const byDepartment = new Map<string, { name: string; count: number; totalTime: number; tickets: number }>();
    ticketsWithResolutionTime.forEach(ticket => {
      const deptId = ticket.departmentId;
      const deptName = ticket.department?.name || 'Unknown';
      
      if (!byDepartment.has(deptId)) {
        byDepartment.set(deptId, { name: deptName, count: 0, totalTime: 0, tickets: 0 });
      }
      
      const deptData = byDepartment.get(deptId)!;
      deptData.count += 1;
      deptData.totalTime += ticket.resolutionTimeHours;
      deptData.tickets += 1;
    });

    // Calculate averages
    const totalResolutionTime = ticketsWithResolutionTime.reduce((sum, t) => sum + t.resolutionTimeHours, 0);
    const averageResolutionTime = ticketsWithResolutionTime.length > 0 
      ? totalResolutionTime / ticketsWithResolutionTime.length 
      : 0;

    // Average per person
    const averagePerPerson = Array.from(byPerson.values()).map(person => ({
      personId: Array.from(byPerson.entries()).find(([_, v]) => v.name === person.name)?.[0] || '',
      name: person.name,
      averageTime: person.tickets > 0 ? person.totalTime / person.tickets : 0,
      ticketsCount: person.tickets,
    }));

    // Average per department
    const averagePerDepartment = Array.from(byDepartment.values()).map(dept => ({
      departmentId: Array.from(byDepartment.entries()).find(([_, v]) => v.name === dept.name)?.[0] || '',
      name: dept.name,
      averageTime: dept.tickets > 0 ? dept.totalTime / dept.tickets : 0,
      ticketsCount: dept.tickets,
    }));

    return {
      general: Array.from(generalData.entries())
        .map(([period, count]) => ({ period, count }))
        .sort((a, b) => a.period.localeCompare(b.period)),
      byPerson: Array.from(byPerson.values()).map(person => ({
        name: person.name,
        count: person.count,
        averageTime: person.tickets > 0 ? person.totalTime / person.tickets : 0,
      })),
      byDepartment: Array.from(byDepartment.values()).map(dept => ({
        name: dept.name,
        count: dept.count,
        averageTime: dept.tickets > 0 ? dept.totalTime / dept.tickets : 0,
      })),
      averageResolutionTime,
      averagePerPerson,
      averagePerDepartment,
    };
  }
}

