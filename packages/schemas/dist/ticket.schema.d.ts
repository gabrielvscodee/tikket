import { z } from 'zod';
export declare const CreateTicketSchema: z.ZodObject<{
    subject: z.ZodString;
    description: z.ZodString;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    departmentId: z.ZodString;
}, z.core.$strip>;
export declare const UpdateTicketSchema: z.ZodObject<{
    subject: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        OPEN: "OPEN";
        IN_PROGRESS: "IN_PROGRESS";
        RESOLVED: "RESOLVED";
        CLOSED: "CLOSED";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    assigneeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AssignTicketSchema: z.ZodObject<{
    assigneeId: z.ZodString;
}, z.core.$strip>;
export type CreateTicketDTO = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketDTO = z.infer<typeof UpdateTicketSchema>;
export type AssignTicketDTO = z.infer<typeof AssignTicketSchema>;
