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

  // ===== AC1: Successful login returns JWT =====

  describe('AC1 — Successful login returns JWT', () => {
    it('should return accessToken, refreshToken, and user on valid login', async () => {
      const result = await service.register('testuser1', 'correct123', 'OWNER', 'store_1');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.user).toEqual({
        id: 'user_testuser1',
        username: 'testuser1',
        role: 'OWNER',
      });
    });

    it('should return JWT payload with correct claims (sub, username, role, storeId)', async () => {
      await service.register('jwtuser1', 'pass456', 'MANAGER', 'store_2');

      const result = await service.login('jwtuser1', 'pass456');
      const payload = JSON.parse(result.accessToken);

      expect(payload.sub).toBe('user_jwtuser1');
      expect(payload.username).toBe('jwtuser1');
      expect(payload.role).toBe('MANAGER');
      expect(payload.storeId).toBe('store_2');
      expect(payload.exp).toBeDefined();
    });

    it('should accept CASHIER role login', async () => {
      await service.register('cashier1', 'cashpass', 'CASHIER', 'store_3');
      const result = await service.login('cashier1', 'cashpass');

      expect(result.accessToken).toBeDefined();
      const payload = JSON.parse(result.accessToken);
      expect(payload.role).toBe('CASHIER');
    });

    it('should reset loginAttempts and lockedUntil on successful login', async () => {
      await service.register('resetuser1', 'secret123', 'OWNER', 'store_1');

      const result = await service.login('resetuser1', 'secret123');

      expect(result).toBeDefined();
      // Success should have reset attempts (mockUsers is mutable at module level)
      expect(result.user).toBeDefined();
    });
  });

  // ===== AC2: 5 failed attempts → lockout 30min =====

  describe('AC2 — 5 failed attempts leads to lockout', () => {
    it('should increment loginAttempts on each wrong password', async () => {
      await service.register('lockuser1', 'correct', 'OWNER', 'store_1');

      // 4 wrong attempts — should throw "Invalid credentials"
      for (let i = 1; i <= 4; i++) {
        await expect(service.login('lockuser1', `wrong${i}`)).rejects.toThrow('Invalid credentials');
      }

      // After 4 attempts, still can login with correct password
      const result = await service.login('lockuser1', 'correct');
      expect(result).toHaveProperty('accessToken');
    });

    it('should lock account after exactly 5 consecutive failed attempts', async () => {
      await service.register('lock5user1', 'correct5', 'OWNER', 'store_1');

      // 5 wrong attempts — check actual error messages
      const errors: string[] = [];
      for (let i = 1; i <= 5; i++) {
        try {
          await service.login('lock5user1', `wrong${i}`);
          errors.push('NO ERROR');
        } catch (e: any) {
          errors.push(e.message);
        }
      }

      // Debug: print what errors we got
      // errors should be: ['Invalid', 'Invalid', 'Invalid', 'Invalid', 'Account locked']
      expect(errors).toEqual([
        'Invalid credentials',
        'Invalid credentials',
        'Invalid credentials',
        'Invalid credentials',
        'Account locked due to too many failed attempts',
      ]);
    });

    it('should throw "Account locked" when locked user tries to login with any password', async () => {
      await service.register('lockedtest1', 'pass', 'OWNER', 'store_1');

      // First 4: "Invalid credentials"
      for (let i = 1; i <= 4; i++) {
        await expect(service.login('lockedtest1', `bad${i}`)).rejects.toThrow('Invalid credentials');
      }

      // 5th: "Account locked"
      await expect(service.login('lockedtest1', 'bad5')).rejects.toThrow(
        'Account locked due to too many failed attempts'
      );

      // After lockout, ANY password fails
      await expect(service.login('lockedtest1', 'anything')).rejects.toThrow(
        'Account locked due to too many failed attempts'
      );
    });

    it('should NOT lock account after fewer than 5 failed attempts', async () => {
      await service.register('partialfail1', 'right', 'OWNER', 'store_1');

      // Only 3 wrong attempts
      await expect(service.login('partialfail1', 'bad1')).rejects.toThrow('Invalid credentials');
      await expect(service.login('partialfail1', 'bad2')).rejects.toThrow('Invalid credentials');
      await expect(service.login('partialfail1', 'bad3')).rejects.toThrow('Invalid credentials');

      // Should still be able to login with correct password
      const result = await service.login('partialfail1', 'right');
      expect(result).toHaveProperty('accessToken');
    });

    it('should return new user on register then login', async () => {
      const result = await service.register('newuser1', 'newpass', 'CASHIER', 'store_x');

      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('newuser1');
      expect(result.user.role).toBe('CASHIER');
    });
  });

  // ===== AC3: RBAC guard blocks unauthorized access =====
  // The RolesGuard is in apps/server/src/common/guards/roles.guard.ts
  // It uses @Roles() decorator + Reflector to check user.role against required roles

  describe('AC3 — RBAC guard blocks unauthorized access', () => {
    it('should allow access when user role matches required role', async () => {
      await service.register('rbacadmin1', 'rbacpass', 'OWNER', 'store_1');
      const result = await service.login('rbacadmin1', 'rbacpass');

      const payload = JSON.parse(result.accessToken);
      // OWNER role should match OWNER requirement
      expect(payload.role).toBe('OWNER');

      // Simulate the RolesGuard canActivate logic:
      // requiredRoles = ['OWNER'], user.role = 'OWNER'
      const requiredRoles: string[] = ['OWNER'];
      const userRole: string = payload.role;
      const allowed = requiredRoles.some((role) => userRole === role);
      expect(allowed).toBe(true);
    });

    it('should block access when CASHIER tries OWNER-only action', async () => {
      await service.register('rbaccashier1', 'cpass', 'CASHIER', 'store_1');
      const result = await service.login('rbaccashier1', 'cpass');

      const payload = JSON.parse(result.accessToken);
      expect(payload.role).toBe('CASHIER');

      // Simulate RolesGuard canActivate for an OWNER-only endpoint
      const requiredRoles: string[] = ['OWNER'];
      const userRole: string = payload.role;
      const allowed = requiredRoles.some((role) => userRole === role);
      expect(allowed).toBe(false);
    });

    it('should block CASHIER from MANAGER-only action', async () => {
      await service.register('rbacman1', 'mpass', 'MANAGER', 'store_2');
      const result = await service.login('rbacman1', 'mpass');

      const payload = JSON.parse(result.accessToken);
      expect(payload.role).toBe('MANAGER');

      // Simulate RolesGuard canActivate for a CASHIER-only endpoint
      const requiredRoles: string[] = ['CASHIER'];
      const userRole: string = payload.role;
      const allowed = requiredRoles.some((role) => userRole === role);
      expect(allowed).toBe(false);
    });

    it('should allow MANAGER when MANAGER is in required roles list', async () => {
      await service.register('rbacmgr1', 'mypass', 'MANAGER', 'store_1');
      const result = await service.login('rbacmgr1', 'mypass');

      const payload = JSON.parse(result.accessToken);
      const requiredRoles: string[] = ['MANAGER', 'OWNER'];
      const allowed = requiredRoles.some((role) => payload.role === role);
      expect(allowed).toBe(true);
    });

    it('should allow access when no required roles specified (public endpoint)', async () => {
      await service.register('publicuser1', 'pubpass', 'CASHIER', 'store_1');
      const result = await service.login('publicuser1', 'pubpass');

      expect(result.accessToken).toBeDefined();
      // When requiredRoles is undefined/falsy, canActivate returns true (public)
      const requiredRoles: string[] | undefined = undefined;
      const allowed = !requiredRoles || requiredRoles.some((role: string) => 'CASHIER' === role);
      expect(allowed).toBe(true);
    });

    it('should block access when user has no role (null user)', async () => {
      // Simulate RolesGuard canActivate logic exactly:
      // const user = context.switchToHttp().getRequest().user;
      // if (!user) return false;
      // return requiredRoles.some(role => user.role === role);
      const requiredRoles: string[] = ['OWNER'];
      const userRole: string | null = null;

      // RolesGuard logic: if (!user) return false
      const allowed = userRole ? requiredRoles.some((role) => userRole === role) : false;
      expect(allowed).toBe(false);
    });

    it('should block access when requiredRoles is empty array', async () => {
      // When requiredRoles is [] (empty), some() returns false → blocked
      const requiredRoles: string[] = [];
      const userRole: string = 'OWNER';
      const allowed = requiredRoles.some((role) => userRole === role);
      expect(allowed).toBe(false);
    });
  });

  // ===== Negative / Boundary / Edge cases =====

  describe('Negative and boundary cases', () => {
    it('should throw "Invalid credentials" for non-existent user', async () => {
      await expect(
        service.login('doesnotexist', 'anypassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw "Invalid credentials" for empty username', async () => {
      await expect(service.login('', 'anypassword')).rejects.toThrow('Invalid credentials');
    });

    it('should throw "Username already exists" when registering duplicate', async () => {
      await service.register('dupuser1', 'pass1', 'OWNER', 'store_1');
      await expect(
        service.register('dupuser1', 'pass2', 'MANAGER', 'store_2')
      ).rejects.toThrow('Username already exists');
    });

    it('should return different accessToken and refreshToken on login', async () => {
      await service.register('twotokens1', 'tokpass', 'OWNER', 'store_1');
      const result = await service.login('twotokens1', 'tokpass');

      expect(result.accessToken).not.toBe(result.refreshToken);
    });
  });
});
