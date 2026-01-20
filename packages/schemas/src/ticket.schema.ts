import { z } from 'zod';
import { TicketStatus, TicketPriority } from '@prisma/client';

export const CreateTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.nativeEnum(TicketPriority).optional(),
  departmentId: z.string().uuid('Department is required'),
  sectionId: z.string().uuid().optional().nullable(),
});

export const UpdateTicketSchema = z.object({
  subject: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional().nullable(),
});

export const AssignTicketSchema = z.object({
  assigneeId: z.string().uuid(),
});

export type CreateTicketDTO = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketDTO = z.infer<typeof UpdateTicketSchema>;
export type AssignTicketDTO = z.infer<typeof AssignTicketSchema>;

