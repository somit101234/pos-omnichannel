import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StaffService } from './staff.service';

export class CreateStaffDto {
  username: string;
  passwordHash: string;
  role: 'OWNER' | 'ADMIN' | 'CASHIER';
  storeId: string;
  email?: string;
  phone?: string;
}

export class UpdateRoleDto {
  role: 'OWNER' | 'ADMIN' | 'CASHIER';
}

@Controller('staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.createStaff(dto);
  }

  @Get()
  findAll(@Body() query: { storeId: string; viewerRole: 'OWNER' | 'ADMIN' | 'CASHIER' }) {
    return this.staffService.getStaffList(query.storeId, query.viewerRole);
  }

  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.staffService.updateStaffRole(id, dto.role);
  }

  @Patch(':id/delete')
  delete(@Param('id') id: string) {
    return this.staffService.deleteStaff(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.staffService.reactivateStaff(id);
  }
}
