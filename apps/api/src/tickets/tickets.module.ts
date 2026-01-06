import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { CommentsController } from './comments/comments.controller';
import { CommentsService } from './comments/comments.service';
import { CommentsRepository } from './comments/comments.repository';

@Module({
  controllers: [TicketsController, CommentsController],
  providers: [
    TicketsService,
    TicketsRepository,
    CommentsService,
    CommentsRepository,
  ],
  exports: [TicketsService, CommentsService],
})
export class TicketsModule {}
