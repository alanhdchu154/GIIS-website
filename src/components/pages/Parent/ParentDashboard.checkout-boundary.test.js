import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import ParentDashboard from './ParentDashboard';

jest.mock('../../main/Nav.js', () => () => <nav>Navigation</nav>);
jest.mock('../../../config/apiBase', () => ({ getApiBase: () => '' }));
jest.mock('../../../api/authStorage', () => ({
  getParentSession: () => ({ studentId: 'student-1', email: 'parent@example.invalid' }),
  clearParentSession: jest.fn(),
}));

const parentData = {
  student: { name: 'Synthetic Student', studentCode: 'GIIS-TEST', gradeLevel: 'Grade 9' },
  stats: { creditsEarned: 0, gpa: null },
  enrollments: [],
  recentActivity: [],
  subscription: null,
  payment: { state: 'inactive', paidThroughDate: null },
  weeklyInsights: null,
  advisor: null,
  advisorNotes: [],
};

function renderDashboard() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/parent']}>
        <ParentDashboard language="en" />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => parentData,
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('an unpaid parent is routed to staff instead of generic Checkout', async () => {
  renderDashboard();

  expect(await screen.findByText('Payment or plan review is needed')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /complete enrollment/i })).not.toBeInTheDocument();
  const reviewLink = screen.getAllByRole('link', { name: /contact admissions/i })
    .find(link => link.getAttribute('href')?.includes('payment%20or%20plan%20review'));
  expect(reviewLink).toHaveAttribute('href', expect.stringContaining('mailto:admissions@genesisideas.school'));
  expect(screen.getByRole('link', { name: /contact billing support/i })).toBeInTheDocument();
  expect(screen.getByText(/GIIS staff issues reviewed payment links/i)).toBeInTheDocument();

  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(global.fetch.mock.calls.some(([url]) => String(url).includes('/api/checkout/create-session'))).toBe(false);
});
