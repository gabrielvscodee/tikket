import { z } from 'zod';
export declare const CreateCommentSchema: z.ZodObject<{
    content: z.ZodString;
    isInternal: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const UpdateCommentSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    isInternal: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type CreateCommentDTO = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentDTO = z.infer<typeof UpdateCommentSchema>;
