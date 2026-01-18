"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserSchema = exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.CreateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
});
exports.UpdateUserSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    disabled: zod_1.z.boolean().optional(),
    departmentIds: zod_1.z.array(zod_1.z.string()).optional(),
});
