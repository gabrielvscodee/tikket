import { z } from 'zod';

export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  isInternal: z.boolean().optional().default(false),
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1).optional(),
  isInternal: z.boolean().optional(),
});

export type CreateCommentDTO = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentDTO = z.infer<typeof UpdateCommentSchema>;

