import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSetPasswordPage from './AdminSetPasswordPage';

jest.mock('../../../config/apiBase', () => ({ getApiBase: () => '' }));

test('reads the invitation token from the fragment and immediately scrubs the URL', async () => {
  window.history.replaceState({}, '', '/admin/set-password#token=synthetic-token');
  render(<MemoryRouter><AdminSetPasswordPage /></MemoryRouter>);
  expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
  await waitFor(() => expect(window.location.hash).toBe(''));
  expect(document.querySelector('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
});

test('does not render the password form without an access token', () => {
  window.history.replaceState({}, '', '/admin/set-password');
  render(<MemoryRouter><AdminSetPasswordPage /></MemoryRouter>);
  expect(screen.getByRole('alert')).toHaveTextContent('missing or invalid');
  expect(screen.queryByLabelText(/Password/)).not.toBeInTheDocument();
});
