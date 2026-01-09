import { z } from 'zod';
export declare const CreateDepartmentSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateDepartmentSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const AddUserToDepartmentSchema: z.ZodObject<{
    userId: z.ZodString;
}, z.core.$strip>;
export declare const RemoveUserFromDepartmentSchema: z.ZodObject<{
    userId: z.ZodString;
}, z.core.$strip>;
export type CreateDepartmentDTO = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentDTO = z.infer<typeof UpdateDepartmentSchema>;
export type AddUserToDepartmentDTO = z.infer<typeof AddUserToDepartmentSchema>;
export type RemoveUserFromDepartmentDTO = z.infer<typeof RemoveUserFromDepartmentSchema>;
