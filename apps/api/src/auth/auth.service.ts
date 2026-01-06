import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}
  
  async login(email: string, password: string, tenantSlug?: string) {
    let tenantId: string | undefined;

    // If tenant slug is provided and not empty (from subdomain), find the tenant
    // Skip tenant validation for localhost/development
    if (tenantSlug && tenantSlug.trim().length > 0) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (!tenant) {
        throw new BadRequestException('Invalid tenant');
      }

      tenantId = tenant.id;
    }
    // If no tenantSlug or empty, allow login without tenant validation (development)

    // Find user by email (tenant validation happens after)
    // In development/localhost, allow login without tenant slug
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If tenant was specified, verify user belongs to it
    if (tenantId && user.tenantId !== tenantId) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    }

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
