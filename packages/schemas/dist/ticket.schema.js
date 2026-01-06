"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignTicketSchema = exports.UpdateTicketSchema = exports.CreateTicketSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.CreateTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1, 'Subject is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    priority: zod_1.z.nativeEnum(client_1.TicketPriority).optional(),
});
exports.UpdateTicketSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
    status: zod_1.z.nativeEnum(client_1.TicketStatus).optional(),
    priority: zod_1.z.nativeEnum(client_1.TicketPriority).optional(),
    assigneeId: zod_1.z.string().uuid().optional().nullable(),
});
exports.AssignTicketSchema = zod_1.z.object({
    assigneeId: zod_1.z.string().uuid(),
});
