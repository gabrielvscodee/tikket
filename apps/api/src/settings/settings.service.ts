import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmailSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        emailSmtpHost: true,
        emailSmtpPort: true,
        emailSmtpSecure: true,
        emailSmtpUser: true,
        emailSmtpPassword: true,
        emailFrom: true,
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return {
      smtpHost: tenant.emailSmtpHost || null,
      smtpPort: tenant.emailSmtpPort || null,
      smtpSecure: tenant.emailSmtpSecure,
      smtpUser: tenant.emailSmtpUser || null,
      emailFrom: tenant.emailFrom || null,
      hasPassword: !!tenant.emailSmtpUser && !!tenant.emailSmtpPassword,
    };
  }

  async updateEmailSettings(tenantId: string, data: {
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;
    emailFrom?: string;
  }) {
    const updateData: any = {};

    if (data.smtpHost !== undefined) {
      updateData.emailSmtpHost = data.smtpHost || null;
    }
    if (data.smtpPort !== undefined) {
      updateData.emailSmtpPort = data.smtpPort || null;
    }
    if (data.smtpSecure !== undefined) {
      updateData.emailSmtpSecure = data.smtpSecure;
    }
    if (data.smtpUser !== undefined) {
      updateData.emailSmtpUser = data.smtpUser || null;
    }
    if (data.smtpPassword !== undefined) {
      if (data.smtpPassword && data.smtpPassword.trim().length > 0) {
        updateData.emailSmtpPassword = data.smtpPassword;
      }
    }
    if (data.emailFrom !== undefined) {
      updateData.emailFrom = data.emailFrom || null;
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
      select: {
        emailSmtpHost: true,
        emailSmtpPort: true,
        emailSmtpSecure: true,
        emailSmtpUser: true,
        emailFrom: true,
      },
    });

    return {
      smtpHost: tenant.emailSmtpHost || null,
      smtpPort: tenant.emailSmtpPort || null,
      smtpSecure: tenant.emailSmtpSecure,
      smtpUser: tenant.emailSmtpUser || null,
      emailFrom: tenant.emailFrom || null,
      hasPassword: !!tenant.emailSmtpUser,
    };
  }
}
