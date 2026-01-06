import { z } from 'zod';
export declare const UpdateTenantSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateTenantDTO = z.infer<typeof UpdateTenantSchema>;
