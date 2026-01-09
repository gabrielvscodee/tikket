import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const UpdateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export const AddUserToDepartmentSchema = z.object({
  userId: z.string().uuid(),
});

export const RemoveUserFromDepartmentSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateDepartmentDTO = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentDTO = z.infer<typeof UpdateDepartmentSchema>;
export type AddUserToDepartmentDTO = z.infer<typeof AddUserToDepartmentSchema>;
export type RemoveUserFromDepartmentDTO = z.infer<typeof RemoveUserFromDepartmentSchema>;
