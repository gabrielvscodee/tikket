import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { CommentsController } from './comments/comments.controller';
import { CommentsService } from './comments/comments.service';
import { CommentsRepository } from './comments/comments.repository';
import { AttachmentsController } from './attachments/attachments.controller';
import { AttachmentsService } from './attachments/attachments.service';
import { AttachmentsRepository } from './attachments/attachments.repository';

@Module({
  controllers: [TicketsController, CommentsController, AttachmentsController],
  providers: [
    TicketsService,
    TicketsRepository,
    CommentsService,
    CommentsRepository,
    AttachmentsService,
    AttachmentsRepository,
  ],
  exports: [TicketsService, CommentsService, AttachmentsService],
})
export class TicketsModule {}

