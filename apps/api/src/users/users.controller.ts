import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import type { CreateUserDTO } from '@tcc/schemas';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('jwt-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in current tenant' })
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.usersService.findAll(tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user in current tenant' })
  create(
    @Body() body: CreateUserDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { role: string },
  ) {
    // Only admins can create users with ADMIN role
    // Default role is USER
    const role = user.role === 'ADMIN' ? 'USER' : 'USER';
    return this.usersService.create(body, tenant.id, role);
  }
}

