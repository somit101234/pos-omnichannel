import { Injectable } from '@nestjs/common';
import { IPlatformAdapter, OrderItem, PlatformType } from './adapters/base.adapter';

@Injectable()
export class PlatformImportService {
  private adapters: Map<string, IPlatformAdapter> = new Map();

  registerAdapter(platform: string, adapter: IPlatformAdapter): void {
    this.adapters.set(platform, adapter);
  }

  getAdapter(platform: string): IPlatformAdapter | undefined {
    return this.adapters.get(platform);
  }

  parseFile(file: Buffer, platform: string): OrderItem[] {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Adapter ${platform} not registered`);
    }
    return adapter.parse(file);
  }
}
