import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantRepository } from '../tenant/tenant.repository';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly tenantRepository: TenantRepository,
    private readonly emailService: EmailService,
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

    // Check if user is disabled
    if (user.disabled) {
      throw new UnauthorizedException('Account is disabled. Please contact an administrator.');
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

  async register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    tenantSlug?: string,
  ) {
    // Validate password confirmation
    if (password !== passwordConfirmation) {
      throw new BadRequestException('Password confirmation does not match');
    }

    // Determine tenant
    let tenantId: string;

    if (tenantSlug && tenantSlug.trim().length > 0) {
      // Find tenant by slug
      const tenant = await this.tenantRepository.findBySlug(tenantSlug);
      if (!tenant) {
        throw new BadRequestException('Invalid tenant');
      }
      tenantId = tenant.id;
    } else {
      // For localhost/development, use default tenant
      const defaultTenant = await this.tenantRepository.findBySlug('default');
      if (!defaultTenant) {
        throw new BadRequestException('Default tenant not found');
      }
      tenantId = defaultTenant.id;
    }

    // Check if user already exists in this tenant
    const existingUser = await this.usersService.findByEmailAndTenant(email, tenantId);
    if (existingUser) {
      throw new ConflictException('User already exists in this tenant');
    }

    // Create user
    const user = await this.usersService.create(
      {
        name,
        email,
        password,
        role: 'USER', // New registrations are always USER role
      },
      tenantId,
    );

    // Return JWT token (auto-login after registration)
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string, tenantSlug?: string) {
    // Find user by email
    const user = await this.usersService.findByEmail(email);
    
    // Don't reveal if user exists or not (security best practice)
    // But we still need to check tenant if tenantSlug is provided
    if (user) {
      // If tenant slug is provided, verify user belongs to it
      if (tenantSlug && tenantSlug.trim().length > 0) {
        const tenant = await this.tenantRepository.findBySlug(tenantSlug);
        if (!tenant || user.tenantId !== tenant.id) {
          // User doesn't belong to this tenant, but don't reveal this
          return { message: 'If an account with that email exists, we have sent a password reset link.' };
        }
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

      // Save reset token to user
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Send email with reset link
      await this.emailService.sendPasswordResetEmail(email, resetToken, user.tenantId, tenantSlug);
    }

    // Always return the same message (security best practice)
    return { message: 'If an account with that email exists, we have sent a password reset link.' };
  }

  async resetPassword(token: string, password: string, passwordConfirmation: string) {
    // Validate password confirmation
    if (password !== passwordConfirmation) {
      throw new BadRequestException('Password confirmation does not match');
    }

    // Find user by reset token
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }
}
