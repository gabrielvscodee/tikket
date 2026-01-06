import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantRepository } from './tenant.repository';
import type { UpdateTenantDTO } from '@tcc/schemas';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async findById(id: string) {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findAll() {
    return this.tenantRepository.findAll();
  }

  async update(id: string, data: UpdateTenantDTO) {
    const tenant = await this.findById(id);

    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.slug) {
      // Check if slug is already taken by another tenant
      const existingTenant = await this.tenantRepository.findBySlug(data.slug);
      if (existingTenant && existingTenant.id !== id) {
        throw new ConflictException('Slug already taken');
      }
      updateData.slug = data.slug;
    }

    return this.tenantRepository.update(id, updateData);
  }
}

