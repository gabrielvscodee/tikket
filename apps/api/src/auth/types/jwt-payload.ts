import { UserRole } from '@prisma/client'

export interface JwtPayload {
  sub: string
  email: string
  name: string
  role: UserRole
  tenantId: string
}
