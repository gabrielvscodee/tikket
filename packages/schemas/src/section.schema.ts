import { z } from 'zod';

export const CreateSectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  departmentId: z.string().uuid(),
});

export const UpdateSectionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export const AddUserToSectionSchema = z.object({
  userId: z.string().uuid(),
});

export const RemoveUserFromSectionSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateSectionDTO = z.infer<typeof CreateSectionSchema>;
export type UpdateSectionDTO = z.infer<typeof UpdateSectionSchema>;
export type AddUserToSectionDTO = z.infer<typeof AddUserToSectionSchema>;
export type RemoveUserFromSectionDTO = z.infer<typeof RemoveUserFromSectionSchema>;
