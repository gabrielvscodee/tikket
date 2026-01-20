import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import type {
  CreateSectionDTO,
  UpdateSectionDTO,
  AddUserToSectionDTO,
  RemoveUserFromSectionDTO,
} from '@tcc/schemas';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Sections')
@ApiBearerAuth('jwt-auth')
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Create a new section (Admin or Supervisor)' })
  create(
    @Body() body: CreateSectionDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.sectionsService.create(body, tenant.id, user.sub, user.role);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'List all sections in a department' })
  findAll(
    @Param('departmentId') departmentId: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.sectionsService.findAll(departmentId, tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a section by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.sectionsService.findOne(id, tenant.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Update a section (Admin or Supervisor)' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateSectionDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.sectionsService.update(id, tenant.id, body, user.sub, user.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Delete a section (Admin or Supervisor)' })
  delete(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.sectionsService.delete(id, tenant.id, user.sub, user.role);
  }

  @Post(':id/users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Add a user to a section (Admin or Supervisor)' })
  addUser(
    @Param('id') id: string,
    @Body() body: AddUserToSectionDTO,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.sectionsService.addUser(id, tenant.id, body, user.sub, user.role);
  }

  @Delete(':id/users/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Remove a user from a section (Admin or Supervisor)' })
  removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string; role: UserRole },
  ) {
    return this.sectionsService.removeUser(id, tenant.id, { userId }, user.sub, user.role);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of a section' })
  getSectionMembers(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.sectionsService.getSectionMembers(id, tenant.id);
  }
}
