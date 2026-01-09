import { z } from 'zod';

export const AttachmentResponseSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  isImage: z.boolean(),
  uploadedBy: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
  }),
  createdAt: z.date(),
});

export type AttachmentResponseDTO = z.infer<typeof AttachmentResponseSchema>;
