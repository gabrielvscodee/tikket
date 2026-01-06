import { z } from 'zod';
export declare const CreateUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<{
        ADMIN: "ADMIN";
        AGENT: "AGENT";
        USER: "USER";
    }>>;
}, z.core.$strip>;
export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
