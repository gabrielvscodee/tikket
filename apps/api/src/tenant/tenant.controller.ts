import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import type { UpdateTenantDTO } from '@tcc/schemas';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Tenants')
@ApiBearerAuth('jwt-auth')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant information' })
  getCurrentTenant(@CurrentTenant() tenant: { id: string }) {
    return this.tenantService.findById(tenant.id);
  }

  @Put('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update current tenant (Admin only)' })
  updateCurrentTenant(
    @Body() body: UpdateTenantDTO,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.tenantService.update(tenant.id, body);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all tenants (Admin only)' })
  findAll() {
    return this.tenantService.findAll();
  }
}



