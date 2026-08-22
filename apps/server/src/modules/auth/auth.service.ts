// Auth service thuần — không dùng Nest decorators cho dễ test
import * as bcrypt from 'bcrypt';

const BCRYPT_COST = 12;
const LOCKOUT_MINUTES = 30;
const MAX_ATTEMPTS = 5;

// Mock DB — trong thực tế sẽ dùng PrismaService
interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  storeId: string;
  loginAttempts: number;
  lockedUntil: Date | null;
}

const mockUsers: Record<string, UserRecord> = {};

export class AuthService {
  async login(username: string, password: string) {
    const user = mockUsers[username];

    if (!user) {
      throw new Error('Invalid credentials'); // sẽ throw 401 ở controller
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account locked due to too many failed attempts');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        throw new Error('Account locked due to too many failed attempts');
      }

      throw new Error('Invalid credentials');
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockedUntil = null;

    // Generate tokens (simplified)
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      storeId: user.storeId,
    };

    return {
      accessToken: JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 15 * 60 }),
      refreshToken: JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async register(username: string, password: string, role: string = 'CASHIER', storeId: string) {
    if (mockUsers[username]) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    mockUsers[username] = {
      id: `user_${username}`,
      username,
      passwordHash: hashedPassword,
      role,
      storeId,
      loginAttempts: 0,
      lockedUntil: null,
    };

    return this.login(username, password);
  }
}

// Export instance
export const authService = new AuthService();
