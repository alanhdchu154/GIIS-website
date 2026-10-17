import React from 'react';
import { render, screen } from '@testing-library/react';
import PlacementDecisionEditor from './PlacementDecisionEditor';

const app = {
  id: 'app_synthetic',
  gradeLevel: 'Grade 9',
  placementRequired: true,
  placementDecision: {
    assessmentDate: '2026-10-09T00:00:00.000Z',
    result: 'ready_with_bridge',
    recommendedGradeLevel: 'Grade 9',
    principalApprovedAt: null,
  },
};

test('marks family-visible placement fields and separates staff-only notes', () => {
  render(<PlacementDecisionEditor app={app} capability={{ available: true }} onChanged={jest.fn()} showToast={jest.fn()} />);

  expect(screen.getByText(/after Principal signature, Bridge \/ next-step plan, First-term plan, and First-week reviewer will appear on the family status page/i)).toBeInTheDocument();
  expect(screen.getByText(/Decision rationale, evidence reviewed, assistance or accommodations, and independent-learning observations remain staff-only/i)).toBeInTheDocument();
  expect(screen.getByText('First-week reviewer — family-visible after signature')).toBeInTheDocument();
  expect(screen.getByText('Bridge or next-step plan — family-visible after signature')).toBeInTheDocument();
  expect(screen.getByText('First-term plan — family-visible after signature')).toBeInTheDocument();
});
