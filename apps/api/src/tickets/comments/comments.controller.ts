import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import type { CreateCommentDTO, UpdateCommentDTO } from '@tcc/schemas';
import { CurrentTenant } from '../../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Ticket Comments')
@ApiBearerAuth('jwt-auth')
@Controller('tickets/:ticketId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to a ticket' })
  create(
    @Param('ticketId') ticketId: string,
    @Body() body: CreateCommentDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string },
  ) {
    return this.commentsService.create(ticketId, tenant.id, user.sub, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for a ticket' })
  findAll(
    @Param('ticketId') ticketId: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { role: UserRole },
  ) {
    return this.commentsService.findAll(ticketId, tenant.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comment by ID' })
  findOne(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { role: UserRole },
  ) {
    return this.commentsService.findOne(id, tenant.id, user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a comment' })
  update(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @Body() body: UpdateCommentDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.commentsService.update(id, tenant.id, body, user.sub, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  delete(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.commentsService.delete(id, tenant.id, user.sub, user.role);
  }
}
