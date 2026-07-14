const mockFindUnique = jest.fn();

jest.mock('../lib/prisma', () => ({
  studentAccount: { findUnique: mockFindUnique },
}));

const { blockIfSoftLocked } = require('./auth');

function responseDouble() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('blockIfSoftLocked', () => {
  let consoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  test('fails closed when account status cannot be verified', async () => {
    const req = { auth: { role: 'student', studentId: 'student-1' } };
    const res = responseDouble();
    const next = jest.fn();
    mockFindUnique.mockRejectedValue(new Error('database unavailable'));

    await blockIfSoftLocked(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Account status could not be verified. Please try again.',
      code: 'account_status_unavailable',
    });
  });

  test('allows an active unlocked student account', async () => {
    const req = { auth: { role: 'student', studentId: 'student-1' } };
    const res = responseDouble();
    const next = jest.fn();
    mockFindUnique.mockResolvedValue({ isActive: true, softLocked: false, lockReason: '' });

    await blockIfSoftLocked(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
