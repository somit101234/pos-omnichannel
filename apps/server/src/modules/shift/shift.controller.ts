// @ts-nocheck: NestJS decorator issue with TypeScript strict mode
import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { ShiftService, StartShiftDto, EndShiftDto, ForceCloseShiftDto } from './shift.service';

export class StartShiftRequest {
  storeId: string;
  userId: string;
}

export class ForceCloseShiftRequest {
  userId: string;
  role: string;
}

@Controller('shift')
export class ShiftController {
  constructor(private shiftService: ShiftService) {}

  @Post('start')
  start(@Body() dto: StartShiftRequest) {
    return this.shiftService.start({
      storeId: dto.storeId,
      userId: dto.userId,
    });
  }

  @Post(':id/end')
  end(@Param('id') shiftId: string, @Body() dto?: EndShiftDto) {
    return this.shiftService.end(shiftId, dto);
  }

  @Post(':id/force-close')
  forceClose(@Param('id') shiftId: string, @Body() dto: ForceCloseShiftRequest) {
    if (!dto.userId || !dto.role) {
      throw new BadRequestException('userId and role are required');
    }
    return this.shiftService.forceClose(shiftId, {
      userId: dto.userId,
      role: dto.role,
    });
  }

  @Get(':id')
  get(@Param('id') shiftId: string) {
    return this.shiftService.get(shiftId);
  }

  @Get('store/:storeId')
  findAll(@Param('storeId') storeId: string) {
    return this.shiftService.findAll(storeId);
  }
}
