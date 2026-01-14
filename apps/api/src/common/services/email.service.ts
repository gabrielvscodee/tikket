import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailService {
  constructor(private readonly prisma: PrismaService) {}

  private async getTransporter(tenantId: string): Promise<nodemailer.Transporter | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        emailSmtpHost: true,
        emailSmtpPort: true,
        emailSmtpSecure: true,
        emailSmtpUser: true,
        emailSmtpPassword: true,
      },
    });

    const smtpHost = tenant?.emailSmtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = tenant?.emailSmtpPort || parseInt(process.env.SMTP_PORT || '587');
    const smtpSecure = tenant?.emailSmtpSecure ?? (process.env.SMTP_SECURE === 'true');
    const smtpUser = tenant?.emailSmtpUser || process.env.SMTP_USER || process.env.EMAIL_FROM;
    const smtpPass = tenant?.emailSmtpPassword || process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

    if (!smtpUser || !smtpPass) {
      return null;
    }

    const transporterConfig: any = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };

    return nodemailer.createTransport(transporterConfig);
  }

  async sendPasswordResetEmail(email: string, resetToken: string, tenantId: string, tenantSlug?: string): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    let resetUrl: string;
    if (tenantSlug && tenantSlug.trim().length > 0) {
      try {
        const url = new URL(baseUrl);
        url.hostname = `${tenantSlug}.${url.hostname}`;
        url.pathname = '/reset-password';
        url.search = `?token=${resetToken}`;
        resetUrl = url.toString();
      } catch {
        resetUrl = `${baseUrl.replace('://', `://${tenantSlug}.`)}/reset-password?token=${resetToken}`;
      }
    } else {
      resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { emailFrom: true },
    });
    const emailFrom = tenant?.emailFrom || process.env.EMAIL_FROM || 'noreply@example.com';

    const mailOptions = {
      from: emailFrom,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>You requested to reset your password. Click the button below to reset it:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
              <p style="font-size: 12px; color: #999; word-break: break-all;">${resetUrl}</p>
              <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
              <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
            </div>
          </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        You requested to reset your password. Click the link below to reset it:
        
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
      `,
    };

    try {
      const transporter = await this.getTransporter(tenantId);
      
      if (!transporter) {
        console.log('⚠️  SMTP credentials not configured. Password reset URL:', resetUrl);
        console.log('📧 To enable email sending, configure email settings in the Settings page (Admin only)');
        return;
      }

      await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully to:', email);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.log('🔗 Password reset URL (for testing):', resetUrl);
      }
    }
  }
}
