import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole } from '@prisma/client';
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
    const effectiveTenantSlug = (tenantSlug && tenantSlug.trim().length > 0) 
      ? tenantSlug.trim() 
      : 'default';

    let tenant = await this.prisma.tenant.findUnique({
      where: { slug: effectiveTenantSlug },
    });

    if (!tenant && effectiveTenantSlug === 'default') {
      await this.ensureDefaultTenantAndAdmin();
      tenant = await this.prisma.tenant.findUnique({
        where: { slug: 'default' },
      });
    }

    if (!tenant) {
      throw new BadRequestException(`Invalid tenant: ${effectiveTenantSlug}`);
    }

    const tenantId = tenant.id;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      if (email === 'admin@default.com' && effectiveTenantSlug === 'default') {
        await this.ensureDefaultTenantAndAdmin();

        const retryUser = await this.usersService.findByEmail(email);
        if (retryUser) {
          if (retryUser.tenantId !== tenantId) {
            await this.prisma.user.update({
              where: { id: retryUser.id },
              data: { tenantId: tenantId },
            });
            retryUser.tenantId = tenantId;
          }

          const passwordValid = await bcrypt.compare(password, retryUser.password);
          if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
          }
          if (retryUser.disabled) {
            throw new UnauthorizedException('Account is disabled. Please contact an administrator.');
          }
          const payload = {
            sub: retryUser.id,
            email: retryUser.email,
            name: retryUser.name,
            role: retryUser.role,
            tenantId: retryUser.tenantId,
          };
          return {
            access_token: this.jwtService.sign(payload),
          };
        }
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.tenantId !== tenantId) {
      const userTenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
      });
      throw new UnauthorizedException(
        `User does not belong to tenant "${effectiveTenantSlug}". User belongs to tenant "${userTenant?.slug || 'unknown'}"`
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
    if (password !== passwordConfirmation) {
      throw new BadRequestException('Password confirmation does not match');
    }

    let tenantId: string;

    if (tenantSlug && tenantSlug.trim().length > 0) {

      const tenant = await this.tenantRepository.findBySlug(tenantSlug);
      if (!tenant) {
        throw new BadRequestException('Invalid tenant');
      }
      tenantId = tenant.id;
    } else {
      const defaultTenant = await this.tenantRepository.findBySlug('default');
      if (!defaultTenant) {
        throw new BadRequestException('Default tenant not found');
      }
      tenantId = defaultTenant.id;
    }

    const existingUser = await this.usersService.findByEmailAndTenant(email, tenantId);
    if (existingUser) {
      throw new ConflictException('User already exists in this tenant');
    }

    const user = await this.usersService.create(
      {
        name,
        email,
        password,
        role: 'USER',
      },
      tenantId,
    );

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
    const user = await this.usersService.findByEmail(email);
    
    if (user) {
      if (tenantSlug && tenantSlug.trim().length > 0) {
        const tenant = await this.tenantRepository.findBySlug(tenantSlug);
        if (!tenant || user.tenantId !== tenant.id) {
          return { message: 'If an account with that email exists, we have sent a password reset link.' };
        }
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      await this.emailService.sendPasswordResetEmail(email, resetToken, user.tenantId, tenantSlug);
    }

    return { message: 'If an account with that email exists, we have sent a password reset link.' };
  }

  async resetPassword(token: string, password: string, passwordConfirmation: string) {
    if (password !== passwordConfirmation) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
  async ensureDefaultTenantAndAdmin() {
    let defaultTenant = await this.prisma.tenant.findUnique({
      where: { slug: 'default' },
    });

    if (!defaultTenant) {
      try {
        defaultTenant = await this.prisma.tenant.create({
          data: {
            name: 'Empresa Padrão',
            slug: 'default',
          },
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          defaultTenant = await this.prisma.tenant.findUnique({
            where: { slug: 'default' },
          });
        } else {
          throw error;
        }
      }
    }

    if (!defaultTenant) {
      throw new Error('Failed to create or find default tenant');
    }

    let adminUser = await this.prisma.user.findUnique({
      where: { email: 'admin@default.com' },
    });

    if (!adminUser) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      adminUser = await this.prisma.user.create({
        data: {
          email: 'admin@default.com',
          password: passwordHash,
          name: 'Administrador Sistema',
          role: UserRole.ADMIN,
          tenantId: defaultTenant.id,
        },
      });
    } else if (adminUser.tenantId !== defaultTenant.id) {
      adminUser = await this.prisma.user.update({
        where: { id: adminUser.id },
        data: { tenantId: defaultTenant.id },
      });
    }

    return {
      tenant: defaultTenant,
      admin: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    };
  }
}
