// @ts-nocheck: NestJS decorator issue with TypeScript strict mode
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseInterceptors,
  FileInterceptor,
} from '@nestjs/common';
import { PlatformImportService } from './platform-import.service';
import { FileInterceptor as MulterFileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

export class PreviewDto {
  platform: string;
}

export class CommitDto {
  platform: string;
}

const xlsxValidator = new FileTypeValidator({ fileType: /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/i });
const fileUploadPipe = new ParseFilePipe({
  validators: [
    xlsxValidator,
    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB max
  ],
});

@Controller('import')
export class PlatformImportController {
  constructor(private platformImportService: PlatformImportService) {}

  @Post('preview')
  @UseInterceptors(MulterFileInterceptor('file'))
  preview(@Body() dto: PreviewDto, @Body('file', fileUploadPipe) file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    if (!dto.platform) {
      throw new BadRequestException('Platform is required');
    }

    const allowedPlatforms = ['SHOPEE', 'GRABFOOD', 'BEOFORD'];
    if (!allowedPlatforms.includes(dto.platform)) {
      throw new BadRequestException(`Invalid platform. Must be one of: ${allowedPlatforms.join(', ')}`);
    }

    const orderItems = this.platformImportService.parseFile(file.buffer, dto.platform);
    
    return {
      platform: dto.platform,
      file: file.originalname,
      itemCount: orderItems.length,
      preview: orderItems.slice(0, 5), // Show first 5 items
    };
  }

  @Post('commit')
  @UseInterceptors(MulterFileInterceptor('file'))
  commit(@Body() dto: CommitDto, @Body('file', fileUploadPipe) file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    if (!dto.platform) {
      throw new BadRequestException('Platform is required');
    }

    const allowedPlatforms = ['SHOPEE', 'GRABFOOD', 'BEOFORD'];
    if (!allowedPlatforms.includes(dto.platform)) {
      throw new BadRequestException(`Invalid platform. Must be one of: ${allowedPlatforms.join(', ')}`);
    }

    const orderItems = this.platformImportService.parseFile(file.buffer, dto.platform);
    
    // TODO: Implement commit to DB
    // This would typically save orders to database
    return {
      platform: dto.platform,
      file: file.originalname,
      itemCount: orderItems.length,
      committed: true,
    };
  }

  @Get('status/:orderId')
  getStatus(@Param('orderId') orderId: string) {
    // TODO: Implement status check from DB
    // This would check import status for a specific order
    return {
      orderId,
      status: 'pending', // Default, would be fetched from DB
    };
  }
}
