// @ts-nocheck: NestJS decorator issue with TypeScript strict mode
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';

export class CreateCategoryDto {
  storeId: string;
  name: string;
  parentId?: string | null;
}

export class UpdateCategoryDto {
  name?: string;
  parentId?: string | null;
}

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    // DTO validation: name required, max 100 chars
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('Category name is required');
    }
    if (dto.name.length > 100) {
      throw new BadRequestException('Category name must be at most 100 characters');
    }
    // Parent self-reference is checked in service layer
    return this.categoriesService.create(dto);
  }

  @Get()
  findAll(@Query('storeId') storeId?: string) {
    if (!storeId) {
      throw new BadRequestException('storeId is required');
    }
    return this.categoriesService.findAll(storeId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    // DTO validation: name max 100 chars if provided
    if (dto.name !== undefined && dto.name.length > 100) {
      throw new BadRequestException('Category name must be at most 100 characters');
    }
    // Parent self-reference is checked in service layer
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    // Block if product references is handled by service layer
    return this.categoriesService.delete(id);
  }
}
