import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminStaffPage from './AdminStaffPage';

jest.mock('../../../api/authStorage', () => ({
  getAdminSession: () => ({ id: 'owner-1', email: 'owner@example.invalid', staffRole: 'owner' }),
  clearAdminSession: jest.fn(),
}));
jest.mock('../../../config/apiBase', () => ({ getApiBase: () => '' }));

const payload = {
  roles: ['principal', 'academic_staff', 'admissions_staff'],
  roleDefinitions: [{ id: 'owner', label: 'Owner', provisionable: false, protected: true, allowed: ['Staff lifecycle'], denied: ['Principal signature'], signingRule: 'Cannot sign.' }],
  summary: { activeAccounts: 2, pendingInvitations: 1, openSessions: 1, configuredPrincipal: 'ready' },
  staff: [{ id: 'owner-1', email: 'owner@example.invalid', displayName: 'Owner', role: 'owner', isActive: true, protection: 'owner', sessions: { openSessionCount: 1 } }],
  invitations: [{ id: 'invite-1', email: 'principal@example.invalid', role: 'principal', accessStatus: 'pending', deliveryStatus: 'provider_accepted', expiresAt: '2026-10-25T00:00:00.000Z' }],
  audit: [{ id: 'audit-1', action: 'staff_invited', targetEmail: 'principal@example.invalid', createdAt: '2026-10-18T00:00:00.000Z', metadata: { reason: 'School operations' } }],
};

beforeEach(() => { global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => payload })); });

test('shows protected accounts, pending delivery state, role boundaries, and audit evidence', async () => {
  render(<MemoryRouter><AdminStaffPage /></MemoryRouter>);
  expect(await screen.findByText('provider_accepted')).toBeInTheDocument();
  expect(screen.getByText('Role boundaries')).toBeInTheDocument();
  expect(screen.getByText('School operations')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /role for owner/i })).toBeDisabled();
});

test('fails closed when the server denies staff management', async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ code: 'permission_denied' }) });
  render(<MemoryRouter><AdminStaffPage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('not authorized'));
  expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
});

test('stages a reasoned access action before sending a mutation', async () => {
  const mutable = { ...payload, staff: [{ id: 'academic-1', email: 'academic@example.invalid', displayName: 'Academic', role: 'academic_staff', isActive: true, protection: null, sessions: { openSessionCount: 1 } }] };
  global.fetch.mockImplementation(async () => ({ ok: true, status: 200, json: async () => mutable }));
  render(<MemoryRouter><AdminStaffPage /></MemoryRouter>);
  await screen.findByText('academic@example.invalid');
  fireEvent.click(screen.getByRole('button', { name: 'Disable' }));
  expect(screen.getByText('Review access action')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText('Operational reason'), { target: { value: 'Synthetic browser acceptance' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm action' }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/admin/staff/academic-1', expect.objectContaining({ method: 'PATCH', body: expect.stringContaining('Synthetic browser acceptance') })));
  expect(await screen.findByText(/Disable account completed/)).toBeInTheDocument();
});
