import bcrypt from 'bcryptjs';
import { Role, User } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { JwtPayload, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { redis, cacheKeys, CACHE_TTL } from '../config/redis';

const sanitizeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  createdAt: user.createdAt,
});

export class AuthService {
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await userRepository.findByEmail(input.email.toLowerCase());
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashed = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({
      email: input.email.toLowerCase(),
      password: hashed,
      firstName: input.firstName,
      lastName: input.lastName,
      role: Role.USER,
    });

    return this.issueTokens(user);
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await userRepository.updateRefreshToken(userId, null);
    await redis.del(cacheKeys.userSession(userId));
    return { loggedOut: true };
  }

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return sanitizeUser(user);
  }

  private async issueTokens(user: User) {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await userRepository.updateRefreshToken(user.id, refreshToken);
    await redis.setex(
      cacheKeys.userSession(user.id),
      CACHE_TTL.SESSION,
      JSON.stringify({ userId: user.id, role: user.role, email: user.email })
    );

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();
