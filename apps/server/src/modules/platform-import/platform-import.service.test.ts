import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformImportService } from './platform-import.service';
import { IPlatformAdapter, OrderItem } from './adapters/base.adapter';

// Mock adapter for testing
class MockAdapter implements IPlatformAdapter {
  parse(_file: Buffer): OrderItem[] {
    return [
      {
        orderNo: 'MOCK-001',
        product: 'Mock Product',
        quantity: 2,
        price: 5000000, // 50,000 VNĐ × 100
        platformFeeRate: 0.15,
        platform: 'SHOPEE',
      },
    ];
  }
}

describe('PlatformImportService', () => {
  let service: PlatformImportService;

  beforeEach(() => {
    service = new PlatformImportService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register adapters', () => {
    const mockAdapter = new MockAdapter();
    (service as any).registerAdapter('MOCK', mockAdapter);
    const registered = (service as any).getAdapter('MOCK');
    expect(registered).toBe(mockAdapter);
  });

  it('should parse file using registered adapter', () => {
    const mockAdapter = new MockAdapter();
    (service as any).registerAdapter('MOCK', mockAdapter);
    
    const result = (service as any).parseFile(Buffer.from(''), 'MOCK');
    expect(result).toHaveLength(1);
    expect(result[0].orderNo).toBe('MOCK-001');
    expect(result[0].product).toBe('Mock Product');
  });

  it('should throw error for unregistered adapter', () => {
    expect(() => {
      (service as any).parseFile(Buffer.from(''), 'SHOPEE');
    }).toThrow('Adapter SHOPEE not registered');
  });
});
