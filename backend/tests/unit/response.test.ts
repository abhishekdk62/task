import { sendSuccess, sendError } from '../../src/utils/response';

describe('Centralized response helpers', () => {
  const mockRes = () => {
    const res: {
      statusCode: number;
      body: unknown;
      status: (code: number) => typeof res;
      json: (payload: unknown) => typeof res;
    } = {
      statusCode: 200,
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        return this;
      },
    };
    return res;
  };

  it('sendSuccess wraps data consistently', () => {
    const res = mockRes();
    sendSuccess(res as never, { ok: true }, 'Done', 201, { page: 1 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: 'Done',
      data: { ok: true },
      meta: { page: 1 },
    });
  });

  it('sendError wraps failures consistently', () => {
    const res = mockRes();
    sendError(res as never, 'Validation failed', 400, { email: ['Required'] });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Validation failed',
      errors: { email: ['Required'] },
    });
  });
});
