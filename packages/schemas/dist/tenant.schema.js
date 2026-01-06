"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTenantSchema = void 0;
const zod_1 = require("zod");
exports.UpdateTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    slug: zod_1.z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
});
