"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCommentSchema = exports.CreateCommentSchema = void 0;
const zod_1 = require("zod");
exports.CreateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Content is required'),
    isInternal: zod_1.z.boolean().optional().default(false),
});
exports.UpdateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).optional(),
    isInternal: zod_1.z.boolean().optional(),
});
