import { Controller, Get, Param } from '@nestjs/common';
import { BomService } from './bom.service';

@Controller('bom')
export class BomController {
  constructor(private readonly bomService: BomService) {}

  @Get('cost/:productId')
  getCost(@Param() params: { productId: string }) {
    return this.bomService.calculateCost(params.productId);
  }

  @Get('report/:productId')
  getReport(@Param() params: { productId: string }) {
    return this.bomService.getBomReport(params.productId);
  }
}
