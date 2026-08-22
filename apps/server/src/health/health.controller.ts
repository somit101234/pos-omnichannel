import { Injectable, Get, Controller } from '@nestjs/common';

@Controller('health')
@Injectable()
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
