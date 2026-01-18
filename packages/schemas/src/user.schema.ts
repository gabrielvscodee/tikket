import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).optional(),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  disabled: z.boolean().optional(),
  departmentIds: z.array(z.string()).optional(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
