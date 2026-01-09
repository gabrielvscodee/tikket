import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AttachmentsRepository } from './attachments.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB for other attachments

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
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
];

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async upload(
    ticketId: string,
    tenantId: string,
    file: Express.Multer.File,
    uploadedById: string,
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

    // Validate file
    this.validateFile(file);

    // Determine if it's an image
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);

    // Create attachment
    // Prisma Bytes accepts Buffer/Uint8Array, convert to proper Uint8Array with ArrayBuffer
    const buffer = Buffer.isBuffer(file.buffer) 
      ? file.buffer 
      : Buffer.from(file.buffer);
    
    // Create a new ArrayBuffer and copy the data to ensure proper typing
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    uint8Array.set(buffer);

    return this.attachmentsRepository.create({
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      isImage,
      data: uint8Array,
      ticket: {
        connect: { id: ticketId },
      },
      uploadedBy: {
        connect: { id: uploadedById },
      },
    });
  }

  async findAll(ticketId: string, tenantId: string) {
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

    return this.attachmentsRepository.findByTicket(ticketId, tenantId);
  }

  async findOne(id: string, tenantId: string, includeData: boolean = false) {
    const attachment = await this.attachmentsRepository.findOne(id, tenantId, includeData);

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async delete(
    id: string,
    tenantId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const attachment = await this.findOne(id, tenantId);

    // Verify ticket exists
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: attachment.ticketId,
        tenantId,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Users can only delete attachments from their own tickets
    // Agents and admins can delete any attachment
    if (userRole === UserRole.USER && ticket.requesterId !== userId) {
      throw new ForbiddenException(
        'You can only delete attachments from your own tickets',
      );
    }

    await this.attachmentsRepository.delete(id, tenantId);

    return { message: 'Attachment deleted successfully' };
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check MIME type
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_ATTACHMENT_TYPES.join(', ')}`,
      );
    }

    // Check file size
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_ATTACHMENT_SIZE;

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    // Additional validation: check if buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File buffer is empty');
    }
  }
}
