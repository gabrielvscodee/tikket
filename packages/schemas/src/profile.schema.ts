import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  currentPassword: z.string().min(6).optional(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

