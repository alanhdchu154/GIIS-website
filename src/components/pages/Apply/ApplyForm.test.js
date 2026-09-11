import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import ApplyForm from './ApplyForm';

function mount(element) {
  return render(<HelmetProvider><MemoryRouter>{element}</MemoryRouter></HelmetProvider>);
}
const next = () => fireEvent.click(screen.getByRole('button', { name: /^(Continue|下一步)$/ }));
const back = () => fireEvent.click(screen.getByRole('button', { name: /^(Back|上一步)$/ }));
const change = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const confirm = () => screen.getAllByRole('checkbox').forEach(box => fireEvent.click(box));
const submit = () => fireEvent.submit(screen.getByRole('form', { name: /Application form|申请表/ }));

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.reject(new Error('Unexpected request; tests must use mocks')));
  Element.prototype.scrollIntoView = jest.fn();
});
afterEach(() => jest.restoreAllMocks());

async function fillNewApplication() {
  change(/Student Full Name/, 'Test Applicant');
  change(/When would the student like to start/, 'exploring');
  change(/Why is your family considering GIIS/, 'A synthetic family is exploring school options and would like to understand suitable courses, family support, and the review process.');
  change(/Date of Birth/, '2010-05-12');
  change(/Grade Level/, 'Grade 9');
  next();
  fireEvent.click(screen.getByRole('radio', { name: 'New student' }));
  change(/Current or Most Recent School/i, 'Fictional School');
  change(/Main family concern/, 'grade9-path');
  next();
  change(/Parent.*Name/i, 'Test Guardian');
  change(/Parent.*Email/i, 'guardian@example.test');
  next(); confirm();
}

test('formal form cannot bypass unavailable capability through direct form submission', async () => {
  fetch.mockResolvedValue({ ok: false });
  await act(async () => { mount(<ApplyForm language="en" />); });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  await fillNewApplication();
  submit();
  expect(screen.getByRole('alert')).toHaveTextContent('Please verify the application service');
  expect(fetch.mock.calls).toHaveLength(1);
  expect(fetch.mock.calls[0][1].method).toBe('HEAD');
  expect(screen.queryByText(/test application is complete/)).not.toBeInTheDocument();
});

test('mocked POST failure keeps form retryable, synchronous repeated submits create one request', async () => {
  let resolvePost;
  fetch.mockImplementation((url, options) => options.method === 'HEAD'
    ? Promise.resolve({ ok: true, headers: { get: () => 'admissions-v5' } })
    : new Promise(resolve => { resolvePost = resolve; }));
  await act(async () => { mount(<ApplyForm language="en" />); });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  await fillNewApplication();
  act(() => { submit(); submit(); });
  expect(fetch.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(1);
  await act(async () => { resolvePost({ ok: false, json: async () => ({ error: 'Synthetic failure; retry' }) }); });
  expect(screen.getByRole('alert')).toHaveTextContent('Synthetic failure; retry');
  expect(screen.getByRole('button', { name: 'Submit application' })).toBeEnabled();
  submit();
  const posts = fetch.mock.calls.filter(([, options]) => options.method === 'POST');
  expect(posts).toHaveLength(2);
  expect(JSON.parse(posts[1][1].body)).toMatchObject({ intakeVersion: 'serious-v1', parentEmail: 'guardian@example.test' });
  await act(async () => { resolvePost({ ok: true, json: async () => ({ confirmationRequired: true }) }); });
  expect(screen.getByText(/Please open the confirmation email sent to/)).toBeInTheDocument();
});

function fillStudent() {
  change(/Student Full Name|学生姓名/, 'Taylor Example');
  change(/Date of Birth|出生日期/, '2010-05-12');
  change(/Grade Level|年级/, 'Grade 11');
  change(/When would the student like to start|希望何时开始/, 'exploring');
  change(/Why is your family considering GIIS|为什么考虑 GIIS/, 'A fictional family is exploring a flexible high-school plan with clear progress updates and guidance on choosing appropriate courses.');
}
function mockService() {
  fetch.mockImplementation((url, options) => Promise.resolve(options.method === 'HEAD'
    ? { ok: true, headers: { get: () => 'admissions-v5' } }
    : { ok: true, json: async () => ({ confirmationRequired: true }) }));
}

test('validation focuses the summary once, correction keeps focus, Enter advances and IME stays in place', async () => {
  mockService();
  await act(async () => { mount(<ApplyForm language="en" />); });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('heading', { name: 'Student Information' })).not.toHaveFocus();
  next();
  expect(screen.getByRole('alert')).toHaveFocus();
  const name = screen.getByLabelText(/Student Full Name/);
  expect(name).toHaveAttribute('aria-invalid', 'true');
  expect(name).toHaveAccessibleDescription('Required');
  name.focus();
  change(/Student Full Name/, 'T');
  change(/Student Full Name/, 'Taylor Example');
  expect(name).toHaveFocus();
  expect(name).toHaveAttribute('aria-invalid', 'false');
  fillStudent();
  change(/Date of Birth/, '2099-01-01');
  next();
  expect(screen.getByText(/not in the future/)).toBeInTheDocument();
  change(/Date of Birth/, '2010-05-12');
  fireEvent.keyDown(name, { key: 'Enter', isComposing: true });
  expect(screen.getByRole('heading', { name: 'Student Information' })).toBeInTheDocument();
  fireEvent.keyDown(name, { key: 'Enter' });
  expect(screen.getByRole('heading', { name: 'Application Path' })).toHaveFocus();
  back();
  expect(screen.getByLabelText(/Student Full Name/)).toHaveValue('Taylor Example');
  expect(fetch.mock.calls.every(([, options]) => options.method === 'HEAD')).toBe(true);
});

test('transfer details validate, edited review matches POST and hidden target date is omitted', async () => {
  mockService();
  await act(async () => { mount(<ApplyForm language="en" />); });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  fillStudent(); next();
  fireEvent.click(screen.getByRole('radio', { name: 'Transfer student' }));
  change(/Current enrollment status/, 'currently-enrolled');
  change(/^School name/, 'Fictional School');
  change(/^Attendance period/, '2024–2026');
  change(/What records are available/, 'no-official-transcript');
  change(/Records request situation/, 'need-giis-help');
  change(/Expected records timing/, 'uncertain');
  change(/Graduation planning preference/, 'target-date');
  change(/Main family concern/, 'credits');
  next();
  expect(screen.getByText('Choose the family target date')).toBeInTheDocument();
  expect(screen.getByText(/Please summarize completed courses/)).toBeInTheDocument();
  change(/Graduation planning preference/, 'normal-pace');
  change(/What records are available/, 'official-transcript');
  expect(screen.queryByText('Choose the family target date')).not.toBeInTheDocument();
  expect(screen.queryByText(/Please summarize completed courses/)).not.toBeInTheDocument();
  change(/Graduation planning preference/, 'target-date');
  change(/What records are available/, 'no-official-transcript');
  change(/Family target date/, '2028-06-01');
  change(/Completed high-school course summary/, 'Fictional English I, Algebra I and Biology; records need review.');
  change(/Previous credits estimate/, '6-11');
  next();
  change(/Parent Full Name/, 'Jordan Example');
  change(/Parent Email/, 'invalid-email');
  change(/Relationship to student/, 'parent');
  change(/Preferred contact method/, 'phone');
  next();
  expect(screen.getByText('Invalid email')).toBeInTheDocument();
  expect(screen.getByText('Required when phone is preferred')).toBeInTheDocument();
  change(/Preferred contact method/, 'email');
  expect(screen.queryByText('Required when phone is preferred')).not.toBeInTheDocument();
  change(/Preferred contact method/, 'phone');
  change(/Parent Email/, 'parent@example.test');
  change(/^Phone/, '555-0100');
  change(/Anything else/, 'Please help explain which school records are needed.');
  next();
  expect(screen.getAllByRole('checkbox').every(box => !box.checked)).toBe(true);
  submit();
  expect(screen.getByRole('alert')).toHaveFocus();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(screen.getByText('We need GIIS guidance')).toBeInTheDocument();
  expect(screen.getByText(/specific target date.*2028-06-01/)).toBeInTheDocument();
  expect(screen.getByText('Credit estimate (planning only)')).toBeInTheDocument();
  expect(screen.getByText('Jordan Example')).toBeInTheDocument();
  back(); back();
  change(/Graduation planning preference/, 'normal-pace');
  next(); next();
  expect(screen.queryByText(/2028-06-01/)).not.toBeInTheDocument();
  confirm(); submit();
  await screen.findByText(/Please open the confirmation email sent to/);
  await waitFor(() => expect(screen.getByRole('status')).toHaveFocus());
  expect(screen.getByRole('heading', { name: 'Confirm parent email' })).toBeInTheDocument();
  const posts = fetch.mock.calls.filter(([, options]) => options.method === 'POST');
  expect(posts).toHaveLength(1);
  expect(JSON.parse(posts[0][1].body)).toMatchObject({
    applicantType: 'transfer', graduationTiming: 'normal-pace', graduationTargetDate: '',
    recordsSituation: 'no-official-transcript', recordsHelpNeeded: 'need-giis-help',
    parentEmail: 'parent@example.test', phone: '555-0100', previousCredits: '6-11',
    tuitionAware: true, transferRecordsAcknowledged: true,
  });
});

test.each(['missing-version', 'network-error'])('unsupported service fails closed and recheck can recover: %s', async mode => {
  fetch.mockImplementation(() => mode === 'network-error'
    ? Promise.reject(new Error('Mock offline'))
    : Promise.resolve({ ok: true, headers: { get: () => null } }));
  await act(async () => { mount(<ApplyForm language="en" />); });
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  await fillNewApplication();
  submit();
  expect(fetch.mock.calls.every(([, options]) => options.method === 'HEAD')).toBe(true);
  mockService();
  fireEvent.click(screen.getByRole('button', { name: /Retry/ }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Submit application' })).toBeEnabled());
  submit();
  await screen.findByText(/Please open the confirmation email sent to/);
  await waitFor(() => expect(screen.getByRole('status')).toHaveFocus());
  expect(screen.getByRole('heading', { name: 'Confirm parent email' })).toBeInTheDocument();
  expect(fetch.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(1);
});


test('a stalled service probe times out without losing entries and Retry recovers', async () => {
  jest.useFakeTimers();
  try {
    fetch.mockImplementation(() => new Promise(() => {}));
    await act(async () => { mount(<ApplyForm language="en" />); });
    await fillNewApplication();
    expect(screen.getByRole('button', { name: 'Checking service…' })).toBeDisabled();
    act(() => { jest.advanceTimersByTime(10001); });
    expect(screen.getByRole('button', { name: 'Application temporarily unavailable' })).toBeDisabled();
    expect(screen.getByText('Test Applicant · Grade 9')).toBeInTheDocument();
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    mockService();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit application' })).toBeEnabled());
  } finally { jest.useRealTimers(); }
});

test('an already-confirmed duplicate focuses its result without asking to confirm again', async () => {
  fetch.mockImplementation((url, options) => Promise.resolve(options.method === 'HEAD'
    ? { ok: true, headers: { get: () => 'admissions-v5' } }
    : { ok: true, json: async () => ({ duplicate: true, confirmationRequired: false }) }));
  await act(async () => { mount(<ApplyForm language="en" />); });
  await fillNewApplication();
  submit();
  await screen.findByText(/Your application is recorded/);
  await waitFor(() => expect(screen.getByRole('status')).toHaveFocus());
  expect(screen.getByText(/no duplicate case was created/)).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Confirm parent email' })).not.toBeInTheDocument();
});
