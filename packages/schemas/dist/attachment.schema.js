"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentResponseSchema = void 0;
const zod_1 = require("zod");
exports.AttachmentResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    filename: zod_1.z.string(),
    mimeType: zod_1.z.string(),
    size: zod_1.z.number(),
    isImage: zod_1.z.boolean(),
    uploadedBy: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        email: zod_1.z.string(),
    }),
    createdAt: zod_1.z.date(),
});
