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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import type { CreateTicketDTO, UpdateTicketDTO, AssignTicketDTO } from '@tcc/schemas';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TicketStatus, TicketPriority, UserRole } from '@prisma/client';

@ApiTags('Tickets')
@ApiBearerAuth('jwt-auth')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

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
  findAll(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('requesterId') requesterId?: string,
  ) {
    // Users can only see their own tickets
    const filters: any = {};
    
    if (user.role === UserRole.USER) {
      filters.requesterId = user.sub;
    } else {
      // Agents and admins can see all tickets, with optional filters
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (assigneeId) filters.assigneeId = assigneeId;
      if (requesterId) filters.requesterId = requesterId;
    }

    return this.ticketsService.findAll(tenant.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.ticketsService.findOne(id, tenant.id);
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
}

