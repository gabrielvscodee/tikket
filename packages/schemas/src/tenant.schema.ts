import { z } from 'zod';

export const UpdateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
});

export type UpdateTenantDTO = z.infer<typeof UpdateTenantSchema>;



