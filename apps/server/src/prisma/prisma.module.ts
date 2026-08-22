import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from '../health/health.controller';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
