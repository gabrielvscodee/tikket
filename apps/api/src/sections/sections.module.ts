import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { SectionsService } from './sections.service';
import { SectionsRepository } from './sections.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SectionsController],
  providers: [SectionsService, SectionsRepository],
  exports: [SectionsService],
})
export class SectionsModule {}
