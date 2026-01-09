import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { CurrentTenant } from '../../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ALLOWED_ATTACHMENT_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
];

@ApiTags('Ticket Attachments')
@ApiBearerAuth('jwt-auth')
@Controller('tickets/:ticketId/attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an attachment to a ticket' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  upload(
    @Param('ticketId') ticketId: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_ATTACHMENT_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.attachmentsService.upload(ticketId, tenant.id, file, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attachments for a ticket' })
  findAll(
    @Param('ticketId') ticketId: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.attachmentsService.findAll(ticketId, tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an attachment by ID (metadata only)' })
  findOne(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.attachmentsService.findOne(id, tenant.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download an attachment file' })
  async download(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
    @Res() res: Response,
  ) {
    const attachment = await this.attachmentsService.findOne(id, tenant.id, true);

    if (!attachment.data) {
      throw new NotFoundException('Attachment data not found');
    }

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.filename}"`,
    );
    res.setHeader('Content-Length', attachment.size);

    res.send(Buffer.from(attachment.data));
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete an attachment' })
  delete(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.attachmentsService.delete(id, tenant.id, user.sub, user.role);
  }
}
