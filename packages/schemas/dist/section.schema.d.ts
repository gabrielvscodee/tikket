import { z } from 'zod';
export declare const CreateSectionSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodString;
}, z.core.$strip>;
export declare const UpdateSectionSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const AddUserToSectionSchema: z.ZodObject<{
    userId: z.ZodString;
}, z.core.$strip>;
export declare const RemoveUserFromSectionSchema: z.ZodObject<{
    userId: z.ZodString;
}, z.core.$strip>;
export type CreateSectionDTO = z.infer<typeof CreateSectionSchema>;
export type UpdateSectionDTO = z.infer<typeof UpdateSectionSchema>;
export type AddUserToSectionDTO = z.infer<typeof AddUserToSectionSchema>;
export type RemoveUserFromSectionDTO = z.infer<typeof RemoveUserFromSectionSchema>;
