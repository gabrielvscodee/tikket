import { Controller, Get, Post, Put, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import type { CreateUserDTO, UpdateProfileDTO, UpdateUserDTO } from '@tcc/schemas';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('jwt-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'List all users in current tenant (Admin/Agent only)' })
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.usersService.findAll(tenant.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(
    @CurrentUser() user: { sub: string },
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.usersService.findById(user.sub, tenant.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Get user details with tickets (Admin/Agent only)' })
  findOne(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.usersService.findByIdWithTickets(id, tenant.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(
    @Body() body: UpdateProfileDTO,
    @CurrentUser() user: { sub: string },
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.usersService.updateProfile(user.sub, tenant.id, {
      name: body.name,
      email: body.email,
      password: body.password,
      currentPassword: body.currentPassword,
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Create a new user in current tenant (Admin/Agent only)' })
  create(
    @Body() body: CreateUserDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { role: UserRole },
  ) {
    // Only admins can assign ADMIN role
    // Agents can create USER or AGENT roles
    // Default role is USER
    if (body.role) {
      if (body.role === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can create users with ADMIN role');
      }
      if (body.role === UserRole.AGENT && user.role === UserRole.USER) {
        throw new ForbiddenException('Users cannot create agents');
      }
    }

    return this.usersService.create(body, tenant.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (role, department, disabled status) - Admin only' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateUserDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { role: UserRole },
  ) {
    return this.usersService.update(id, tenant.id, body);
  }
}

