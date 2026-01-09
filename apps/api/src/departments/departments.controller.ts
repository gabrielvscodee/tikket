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
import { DepartmentsService } from './departments.service';
import type {
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  AddUserToDepartmentDTO,
  RemoveUserFromDepartmentDTO,
} from '@tcc/schemas';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Departments')
@ApiBearerAuth('jwt-auth')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new department (Admin only)' })
  create(
    @Body() body: CreateDepartmentDTO,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.departmentsService.create(body, tenant.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all departments in current tenant' })
  findAll(@CurrentTenant() tenant: { id: string }) {
    return this.departmentsService.findAll(tenant.id);
  }

  @Get('my-departments')
  @ApiOperation({ summary: 'Get departments for current user' })
  getMyDepartments(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { sub: string },
  ) {
    return this.departmentsService.getUserDepartments(user.sub, tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a department by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.departmentsService.findOne(id, tenant.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a department (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateDepartmentDTO,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.departmentsService.update(id, tenant.id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a department (Admin only)' })
  delete(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.departmentsService.delete(id, tenant.id);
  }

  @Post(':id/users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a user to a department (Admin only)' })
  addUser(
    @Param('id') id: string,
    @Body() body: AddUserToDepartmentDTO,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.departmentsService.addUser(id, tenant.id, body);
  }

  @Delete(':id/users/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a user from a department (Admin only)' })
  removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.departmentsService.removeUser(id, tenant.id, { userId });
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of a department' })
  getDepartmentMembers(
    @Param('id') id: string,
    @CurrentTenant() tenant: { id: string },
  ) {
    return this.departmentsService.getDepartmentMembers(id, tenant.id);
  }
}
