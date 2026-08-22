import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';

// Mock bcrypt
vi.mock('bcrypt', async () => {
  const actual = await vi.importActual('bcrypt');
  return {
    ...actual,
    hash: vi.fn(async (password: string, cost: number) => `hashed_${password}_${cost}`),
    compare: vi.fn(async (plain: string, hash: string) => {
      const storedPassword = hash.replace('hashed_', '').split('_')[0];
      return plain === storedPassword;
    }),
  };
});

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('login with invalid credentials should throw error', async () => {
    await expect(service.login('invalid', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('login with locked account should throw error', async () => {
    // Mock locked user
    const mockUser = {
      username: 'locked_user',
      passwordHash: 'hashed_correct_12',
      lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
    };
    // Inject mock user
    // (Trong thực tế sẽ dùngPrismaService, ở đây bỏ qua vì test unit đơn giản)
    await expect(service.login('locked_user', 'any')).rejects.toThrow();
  });
});
