import { z } from 'zod';
export declare const CreateUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<{
        ADMIN: "ADMIN";
        SUPERVISOR: "SUPERVISOR";
        AGENT: "AGENT";
        USER: "USER";
    }>>;
}, z.core.$strip>;
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
export declare const UpdateUserSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<{
        ADMIN: "ADMIN";
        SUPERVISOR: "SUPERVISOR";
        AGENT: "AGENT";
        USER: "USER";
    }>>;
    disabled: z.ZodOptional<z.ZodBoolean>;
    departmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
