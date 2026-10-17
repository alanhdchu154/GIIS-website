import { accountFallbackWelcomeEmail } from './ApplicationsQueue';

const credentials = {
  parentContactEmail: 'parent@example.invalid',
  parentLoginEmail: 'parent.login@example.invalid',
  parentPassword: 'parent-temp',
  studentEmail: 'student@example.invalid',
  studentPassword: 'student-temp',
  loginUrl: 'https://example.invalid/login',
};

test('paid fallback copy verifies accounts but keeps course setup pending', () => {
  const message = accountFallbackWelcomeEmail({ ...credentials, linkedSubscriptions: 1 });

  expect(message).toContain('portal accounts verified — course setup pending');
  expect(message).toContain('Account access does not mean course setup is complete.');
  expect(message).toContain('approved courses, first due date, and first-week reviewer');
  expect(message).toContain('Please wait for GIIS to confirm those details before the student begins.');
  expect(message).toContain('If the parent or student dashboard is empty, setup is still pending');
  expect(message).not.toMatch(/complete enrollment/i);
  expect(message).not.toMatch(/first-week instructions/i);
  expect(message).not.toMatch(/welcome to GIIS/i);
});

test('unpaid fallback copy does not imply payment or course access', () => {
  const message = accountFallbackWelcomeEmail({ ...credentials, linkedSubscriptions: 0 });

  expect(message).toContain('Course access remains pending while admissions confirms payment');
  expect(message).not.toContain('Payment has been recorded.');
});
