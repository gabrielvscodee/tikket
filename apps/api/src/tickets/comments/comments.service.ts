import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateCommentDTO, UpdateCommentDTO } from '@tcc/schemas';
import { UserRole } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    ticketId: string,
    tenantId: string,
    authorId: string,
    data: CreateCommentDTO,
  ) {
    // Verify ticket exists and belongs to tenant
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        tenantId,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Verify author exists and belongs to tenant
    const author = await this.prisma.user.findFirst({
      where: {
        id: authorId,
        tenantId,
      },
    });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    // Only agents/admins can create internal comments
    if (data.isInternal && author.role === UserRole.USER) {
      throw new ForbiddenException('Only agents and admins can create internal comments');
    }

    return this.commentsRepository.create({
      content: data.content,
      isInternal: data.isInternal || false,
      ticket: {
        connect: { id: ticketId },
      },
      author: {
        connect: { id: authorId },
      },
      tenant: {
        connect: { id: tenantId },
      },
    });
  }

  findAll(ticketId: string, tenantId: string, userRole: UserRole) {
    // Users can only see non-internal comments
    // Agents and admins can see all comments
    const includeInternal = userRole === UserRole.ADMIN || userRole === UserRole.AGENT;
    
    return this.commentsRepository.findAll(ticketId, tenantId, includeInternal);
  }

  async findOne(id: string, tenantId: string, userRole: UserRole) {
    const comment = await this.commentsRepository.findOne(id, tenantId);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Users cannot see internal comments
    if (comment.isInternal && userRole === UserRole.USER) {
      throw new ForbiddenException('Comment not found');
    }

    return comment;
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateCommentDTO,
    userId: string,
    userRole: UserRole,
  ) {
    const comment = await this.findOne(id, tenantId, userRole);

    // Users can only update their own comments
    if (userRole === UserRole.USER && comment.authorId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    // Only agents/admins can change isInternal flag
    if (data.isInternal !== undefined && userRole === UserRole.USER) {
      throw new ForbiddenException('Only agents and admins can change comment visibility');
    }

    return this.commentsRepository.update(id, tenantId, {
      ...(data.content && { content: data.content }),
      ...(data.isInternal !== undefined && { isInternal: data.isInternal }),
    });
  }

  async delete(id: string, tenantId: string, userId: string, userRole: UserRole) {
    const comment = await this.findOne(id, tenantId, userRole);

    // Users can only delete their own comments
    // Agents can delete any comment on their assigned tickets
    // Admins can delete any comment
    if (userRole === UserRole.USER && comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    if (userRole === UserRole.AGENT && comment.authorId !== userId) {
      // Check if agent is assigned to the ticket
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          id: comment.ticketId,
          tenantId,
          assigneeId: userId,
        },
      });

      if (!ticket) {
        throw new ForbiddenException('You can only delete comments on your assigned tickets');
      }
    }

    return this.commentsRepository.delete(id, tenantId);
  }
}
