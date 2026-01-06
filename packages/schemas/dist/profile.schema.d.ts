import { z } from 'zod';
export declare const UpdateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    currentPassword: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
