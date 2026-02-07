import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import type { CreateTicketDTO, UpdateTicketDTO, AssignTicketDTO } from '@tcc/schemas';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TicketStatus, TicketPriority, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Tickets')
@ApiBearerAuth('jwt-auth')
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  create(
    @Body() body: CreateTicketDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string },
  ) {
    return this.ticketsService.create(body, tenant.id, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List all tickets in current tenant' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @ApiQuery({ name: 'assigneeId', required: false, type: String })
  @ApiQuery({ name: 'requesterId', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in subject/description' })
  @ApiQuery({ name: 'createdIn', required: false, type: String, description: 'Filter by date created (YYYY-MM-DD)' })
  async findAll(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('requesterId') requesterId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('createdIn') createdIn?: string,
  ) {
    const filters: any = {};
    
    if (user.role === UserRole.USER) {
      filters.requesterId = user.sub;
    } else if (user.role === UserRole.AGENT || user.role === UserRole.SUPERVISOR) {
      // Get user's departments
      const userDepartments = await this.prisma.userDepartment.findMany({
        where: {
          userId: user.sub,
          department: {
            tenantId: tenant.id,
          },
        },
        select: {
          departmentId: true,
        },
      });

      // Get user's sections
      const userSections = await this.prisma.userSection.findMany({
        where: {
          userId: user.sub,
          section: {
            department: {
              tenantId: tenant.id,
            },
          },
        },
        select: {
          sectionId: true,
        },
      });

      const departmentIds = userDepartments.map(ud => ud.departmentId);
      const sectionIds = userSections.map(us => us.sectionId);
      
      if (departmentIds.length === 0 && sectionIds.length === 0) {
        return [];
      }

      // For AGENT/SUPERVISOR: show tickets where:
      // 1. User is the requester, OR
      // 2. Ticket is in user's department (and has no section), OR
      // 3. Ticket is in user's section
      // We'll filter this in the service/repository level
      filters.departmentIds = departmentIds;
      filters.sectionIds = sectionIds;
      filters.userId = user.sub; // For requester check
      
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (assigneeId) filters.assigneeId = assigneeId;
      if (requesterId) filters.requesterId = requesterId;
      if (departmentId) filters.departmentId = departmentId;
    } else {
      // ADMIN can see everything
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (assigneeId) filters.assigneeId = assigneeId;
      if (requesterId) filters.requesterId = requesterId;
      if (departmentId) filters.departmentId = departmentId;
    }

    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const opts =
      pageNum != null && limitNum != null
        ? {
            page: isNaN(pageNum) ? 1 : Math.max(1, pageNum),
            limit: isNaN(limitNum) ? 20 : Math.min(100, Math.max(1, limitNum)),
            search: search?.trim() || undefined,
            createdIn: createdIn || undefined,
          }
        : undefined;

    const result = await this.ticketsService.findAll(tenant.id, filters, opts);
    if (result && typeof result === 'object' && 'data' in result && 'total' in result) {
      const totalPages = Math.ceil(result.total / (opts!.limit ?? 20));
      return {
        data: result.data,
        total: result.total,
        page: opts!.page,
        limit: opts!.limit,
        totalPages,
      };
    }
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    const ticket = await this.ticketsService.findOne(id, tenant.id);

    // Check if user is the requester
    const isRequester = ticket.requesterId === user.sub;

    // Check if user belongs to the department
    const userInDepartment = await this.prisma.userDepartment.findFirst({
      where: {
        userId: user.sub,
        departmentId: ticket.departmentId,
      },
    });

    // Check if user belongs to the section (if ticket has a section)
    let userInSection = false;
    if (ticket.sectionId) {
      const userSection = await this.prisma.userSection.findFirst({
        where: {
          userId: user.sub,
          sectionId: ticket.sectionId,
        },
      });
      userInSection = !!userSection;
    }

    // Allow access if:
    // 1. User is the requester, OR
    // 2. User belongs to the department (and section if ticket has one), OR
    // 3. User is ADMIN or SUPERVISOR (they have access to everything)
    if (!isRequester && !userInDepartment && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException('You can only view tickets from your departments/sections or tickets you created');
    }

    // If ticket has a section, user must be in that section (unless they're the requester or admin/supervisor)
    if (ticket.sectionId && !isRequester && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      if (!userInSection && !userInDepartment) {
        throw new ForbiddenException('You can only view tickets from your sections or tickets you created');
      }
    }

    return ticket;
  }

  @Get(':id/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get ticket change history (agents/admins/supervisors only)' })
  getHistory(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.ticketsService.getHistory(id, tenant.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a ticket' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateTicketDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.ticketsService.update(id, tenant.id, body, user.sub, user.role);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Assign a ticket to an agent (Admin/Agent only)' })
  assign(
    @Param('id') id: string,
    @Body() body: AssignTicketDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.ticketsService.assign(id, tenant.id, body, user.sub, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket' })
  delete(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.ticketsService.delete(id, tenant.id, user.sub, user.role);
  }

  @Get('analytics/stats')
  @ApiOperation({ summary: 'Get ticket analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['YEAR', 'SEMIANNUAL', 'BIMONTHLY', 'MONTHLY'], description: 'Time period for analytics (deprecated, use startDate/endDate)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'viewMode', required: false, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY'], description: 'View mode for grouping data' })
  async getAnalytics(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
    @Query('period') period?: 'YEAR' | 'SEMIANNUAL' | 'BIMONTHLY' | 'MONTHLY',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('viewMode') viewMode?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY',
  ) {
    return this.ticketsService.getAnalytics(tenant.id, period, user.role, user.sub, startDate, endDate, viewMode);
  }

  @Post('auto-close')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Auto-close tickets that have been RESOLVED for 7 days (Admin only)' })
  async autoCloseResolvedTickets(
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.ticketsService.autoCloseResolvedTickets(tenant.id);
  }
}

