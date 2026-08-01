import {
  createTaskSchema,
  loginSchema,
  registerSchema,
  taskQuerySchema,
} from '../../src/utils/validators';

describe('Auth validators', () => {
  it('accepts a strong registration payload', () => {
    const parsed = registerSchema.safeParse({
      email: 'dev@taskflow.com',
      password: 'SecurePass1',
      firstName: 'Dev',
      lastName: 'User',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects weak passwords', () => {
    const parsed = registerSchema.safeParse({
      email: 'dev@taskflow.com',
      password: 'weak',
      firstName: 'Dev',
      lastName: 'User',
    });
    expect(parsed.success).toBe(false);
  });

  it('requires login credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'bad', password: '' }).success).toBe(false);
  });
});

describe('Task validators', () => {
  it('parses create task JSON payload strings', () => {
    const parsed = createTaskSchema.safeParse({
      title: 'Invoice job',
      priority: 'HIGH',
      payload: '{"type":"invoice"}',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.payload).toEqual({ type: 'invoice' });
    }
  });

  it('coerces pagination query params', () => {
    const parsed = taskQuerySchema.safeParse({
      page: '2',
      limit: '20',
      status: 'PENDING',
      sortOrder: 'asc',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(20);
    }
  });
});
