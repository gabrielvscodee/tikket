import { z } from 'zod';
export declare const AttachmentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    filename: z.ZodString;
    mimeType: z.ZodString;
    size: z.ZodNumber;
    isImage: z.ZodBoolean;
    uploadedBy: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export type AttachmentResponseDTO = z.infer<typeof AttachmentResponseSchema>;
