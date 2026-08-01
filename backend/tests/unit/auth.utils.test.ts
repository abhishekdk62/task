import { AppError, ValidationError, NotFoundError } from '../../src/utils/errors';
import { signAccessToken, verifyAccessToken } from '../../src/utils/jwt';
import { Role } from '@prisma/client';

describe('AppError hierarchy', () => {
  it('creates operational errors with status codes', () => {
    const err = new ValidationError('bad input', { field: 'email' });
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.errors).toEqual({ field: 'email' });
  });

  it('supports NotFoundError', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });
});

describe('JWT helpers', () => {
  it('signs and verifies access tokens', () => {
    const token = signAccessToken({
      userId: 'user-1',
      email: 'test@example.com',
      role: Role.USER,
    });

    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe('user-1');
    expect(payload.email).toBe('test@example.com');
    expect(payload.role).toBe(Role.USER);
  });
});
