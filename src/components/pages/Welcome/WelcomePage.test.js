import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import WelcomePage from './WelcomePage';

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/welcome?session_id=cs_synthetic']}>
        <WelcomePage language="en" />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  cleanup();
  delete global.fetch;
});

test('confirmed payment does not claim enrollment, readiness, or course activation', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      paymentStatus: 'paid',
      planType: 'guided_monthly',
      knownInDb: true,
    }),
  });
  renderPage();

  await screen.findByText('Payment confirmed');
  expect(screen.getByRole('heading', { name: 'Payment and account setup' })).toBeInTheDocument();
  expect(screen.getByText(/does not by itself mean enrollment is active or courses are ready/i)).toBeInTheDocument();
  expect(screen.queryByText(/you.re in/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/^enrolled$/i)).not.toBeInTheDocument();
  expect(screen.getByText(/begins only after the approved first-term courses appear/i)).toBeInTheDocument();
});

test('an unconfirmed checkout status is described as processing, not received', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      paymentStatus: 'unpaid',
      planType: 'guided_monthly',
      knownInDb: false,
    }),
  });
  renderPage();

  await screen.findByText('Payment processing');
  expect(screen.queryByText('Payment received')).not.toBeInTheDocument();
});
