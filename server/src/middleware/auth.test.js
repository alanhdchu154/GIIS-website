const mockAccountFindUnique = jest.fn();
const mockStudentFindUnique = jest.fn();

jest.mock('../lib/prisma', () => ({
  studentAccount: { findUnique: mockAccountFindUnique },
  student: { findUnique: mockStudentFindUnique },
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
    mockStudentFindUnique.mockResolvedValue({ paidThroughDate: null });
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  test('fails closed when account status cannot be verified', async () => {
    const req = { auth: { role: 'student', studentId: 'student-1' } };
    const res = responseDouble();
    const next = jest.fn();
    mockAccountFindUnique.mockRejectedValue(new Error('database unavailable'));

    await blockIfSoftLocked(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Account status could not be verified. Please try again.',
      code: 'account_status_unavailable',
    });
    expect(mockStudentFindUnique).not.toHaveBeenCalled();
  });

  test('allows an active unlocked student account', async () => {
    const req = { auth: { role: 'student', studentId: 'student-1' } };
    const res = responseDouble();
    const next = jest.fn();
    mockAccountFindUnique.mockResolvedValue({ isActive: true, softLocked: false, lockReason: '' });

    await blockIfSoftLocked(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('blocks new work when the manual paid-through date has lapsed', async () => {
    const req = { auth: { role: 'student', studentId: 'student-1' } };
    const res = responseDouble();
    const next = jest.fn();
    mockAccountFindUnique.mockResolvedValue({ isActive: true, softLocked: false, lockReason: '' });
    mockStudentFindUnique.mockResolvedValue({ paidThroughDate: new Date('2000-01-01T00:00:00.000Z') });

    await blockIfSoftLocked(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Account access limited — payment period has lapsed',
      code: 'payment_lapsed',
      lockReason: 'payment_past_due',
    });
  });

  test('allows new work while the manual paid-through date is current', async () => {
    const req = { auth: { role: 'student', studentId: 'student-1' } };
    const res = responseDouble();
    const next = jest.fn();
    mockAccountFindUnique.mockResolvedValue({ isActive: true, softLocked: false, lockReason: '' });
    mockStudentFindUnique.mockResolvedValue({ paidThroughDate: new Date('2999-12-31T00:00:00.000Z') });

    await blockIfSoftLocked(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
