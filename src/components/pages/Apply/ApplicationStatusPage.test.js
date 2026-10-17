import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import ApplicationStatusPage from './ApplicationStatusPage';

const TOKEN = 'a'.repeat(43);
const FOUND = {
  state: 'found',
  submittedAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-02T00:00:00.000Z',
  interestConfirmed: true,
  recordsStatus: { code: 'not_requested', label: 'Not yet requested' },
  stage: { code: 'admissions_review', label: 'Admissions review in progress' },
  nextStep: 'Our admissions team is reviewing your application.',
  accountsReady: false,
};

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <ApplicationStatusPage language="en" />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  window.history.replaceState(null, '', `/application/status#token=${TOKEN}`);
  global.fetch = jest.fn();
});

afterEach(() => {
  cleanup();
  delete global.fetch;
  window.history.replaceState(null, '', '/');
});

test('clears the fragment immediately, performs one lookup, and does not persist the credential on refresh', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => FOUND });
  const first = renderPage();

  expect(window.location.hash).toBe('');
  await screen.findByText('Admissions review in progress');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({ token: TOKEN });

  first.unmount();
  renderPage();
  await screen.findByText('Reopen the link from your email');
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('keeps the credential in memory for a retryable failure and succeeds on retry', async () => {
  global.fetch
    .mockRejectedValueOnce(new Error('temporary network failure'))
    .mockResolvedValueOnce({ ok: true, json: async () => FOUND });
  renderPage();

  const retry = await screen.findByRole('button', { name: 'Try again' });
  fireEvent.click(retry);
  await screen.findByText('Admissions review in progress');
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual({ token: TOKEN });
});

test('shows invalid only for a successful generic invalid response', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ state: 'invalid' }) });
  renderPage();
  await screen.findByText('This status link is no longer valid');
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
});

test('treats an unrecognized successful response as retryable instead of invalid', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ unexpected: true }) });
  renderPage();
  await screen.findByRole('button', { name: 'Try again' });
  expect(screen.queryByText('This status link is no longer valid')).not.toBeInTheDocument();
});
