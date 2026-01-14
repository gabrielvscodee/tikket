import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateEmailSettingsDTO } from './dto/update-email-settings.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Settings')
@Controller('settings')
@ApiBearerAuth('jwt-auth')
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('email')
  @ApiOperation({ summary: 'Get email configuration (Admin only)' })
  getEmailSettings(@CurrentTenant() tenant: any) {
    return this.settingsService.getEmailSettings(tenant.id);
  }

  @Put('email')
  @ApiOperation({ summary: 'Update email configuration (Admin only)' })
  updateEmailSettings(
    @CurrentTenant() tenant: any,
    @Body() body: UpdateEmailSettingsDTO,
  ) {
    return this.settingsService.updateEmailSettings(tenant.id, body);
  }
}
