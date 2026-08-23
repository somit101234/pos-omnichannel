// @ts-nocheck: NestJS decorator issue with TypeScript strict mode
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';

// DTOs
export class CreateProductDto {
  storeId: string;
  name: string;
  barcode?: string;
  categoryId: string;
  unit?: string;
  costPrice: number | string;
  salePrice: number | string;
  minStock?: number;
  isBom?: boolean;
}

export class UpdateProductDto {
  name?: string;
  barcode?: string;
  categoryId?: string;
  unit?: string;
  costPrice?: number | string;
  salePrice?: number | string;
  minStock?: number;
  isBom?: boolean;
}

export class CreateUnitConversionDto {
  productId: string;
  fromUnit: string;
  toUnit: string;
  ratio: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query('storeId') storeId?: string) {
    if (storeId) {
      return this.productsService.findAll(storeId);
    }
    return this.productsService.findAll('');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get('barcode/:storeId/:barcode')
  findByBarcode(@Param('storeId') storeId: string, @Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(storeId, barcode);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto.storeId, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Unit Conversion endpoints
  @Post('conversions')
  @HttpCode(HttpStatus.CREATED)
  createUnitConversion(@Body() dto: CreateUnitConversionDto) {
    return this.productsService.createUnitConversion(dto);
  }

  @Get(':productId/conversions')
  getUnitConversions(@Param('productId') productId: string) {
    return this.productsService.findUnitConversions(productId);
  }

  @Get('convert/:productId/:fromUnit/:toUnit/:quantity')
  convertUnit(
    @Param('productId') productId: string,
    @Param('fromUnit') fromUnit: string,
    @Param('toUnit') toUnit: string,
    @Param('quantity') quantity: number,
  ) {
    return this.productsService.convertUnit(productId, fromUnit, toUnit, quantity);
  }
}
