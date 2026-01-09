"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveUserFromDepartmentSchema = exports.AddUserToDepartmentSchema = exports.UpdateDepartmentSchema = exports.CreateDepartmentSchema = void 0;
const zod_1 = require("zod");
exports.CreateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
});
exports.UpdateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional().nullable(),
});
exports.AddUserToDepartmentSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
exports.RemoveUserFromDepartmentSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
