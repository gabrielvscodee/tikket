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
  async findAll(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('requesterId') requesterId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const filters: any = {};
    
    if (user.role === UserRole.USER) {
      filters.requesterId = user.sub;
    } else if (user.role === UserRole.AGENT) {
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

      const departmentIds = userDepartments.map(ud => ud.departmentId);
      
      if (departmentIds.length === 0) {
        return [];
      }

      filters.departmentIds = departmentIds;
      
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (assigneeId) filters.assigneeId = assigneeId;
      if (requesterId) filters.requesterId = requesterId;
      if (departmentId) filters.departmentId = departmentId;
    } else {
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (assigneeId) filters.assigneeId = assigneeId;
      if (requesterId) filters.requesterId = requesterId;
      if (departmentId) filters.departmentId = departmentId;
    }

    return this.ticketsService.findAll(tenant.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    const ticket = await this.ticketsService.findOne(id, tenant.id);

    if (user.role === UserRole.USER) {
      if (ticket.requesterId !== user.sub) {
        throw new ForbiddenException('You can only view your own tickets');
      }
    } else if (user.role === UserRole.AGENT) {
      const userInDepartment = await this.prisma.userDepartment.findFirst({
        where: {
          userId: user.sub,
          departmentId: ticket.departmentId,
        },
      });

      if (!userInDepartment) {
        throw new ForbiddenException('You can only view tickets from your departments');
      }
    }

    return ticket;
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
    @CurrentUser() user: { role: UserRole },
  ) {
    return this.ticketsService.assign(id, tenant.id, body, user.role);
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
  @ApiQuery({ name: 'period', required: false, enum: ['YEAR', 'SEMIANNUAL', 'BIMONTHLY', 'MONTHLY'], description: 'Time period for analytics' })
  async getAnalytics(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
    @Query('period') period: 'YEAR' | 'SEMIANNUAL' | 'BIMONTHLY' | 'MONTHLY' = 'MONTHLY',
  ) {
    return this.ticketsService.getAnalytics(tenant.id, period, user.role, user.sub);
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

