"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveUserFromSectionSchema = exports.AddUserToSectionSchema = exports.UpdateSectionSchema = exports.CreateSectionSchema = void 0;
const zod_1 = require("zod");
exports.CreateSectionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().uuid(),
});
exports.UpdateSectionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional().nullable(),
});
exports.AddUserToSectionSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
exports.RemoveUserFromSectionSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
