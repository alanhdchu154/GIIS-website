import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrincipalReviewPage from './PrincipalReviewPage';

const mockAdminSession = { staffRole: 'principal' };
jest.mock('../../../api/authStorage', () => ({
  getAdminSession: () => mockAdminSession,
  clearAdminSession: jest.fn(),
}));

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ([{
      id: 'app_synthetic',
      studentName: 'Synthetic Student',
      applicantType: 'new',
      gradeLevel: 'Grade 9',
      currentSchool: 'Synthetic School',
      placementDecision: {
        result: 'ready_with_bridge',
        recommendedGradeLevel: 'Grade 9',
        decisionRationale: 'Staff-only rationale',
        evidenceReviewed: 'Staff-only evidence',
        firstTermPlan: 'English I and Algebra I',
        bridgePlan: 'Weekly writing support',
        firstWeekReviewer: 'Academic Advisor',
        principalApprovedAt: null,
      },
      transferEvaluation: null,
    }]),
  });
});

afterEach(() => {
  delete global.fetch;
});

test('warns the Principal which placement fields become family-visible after signature', async () => {
  render(<MemoryRouter><PrincipalReviewPage /></MemoryRouter>);

  await screen.findByText('Synthetic Student');
  expect(screen.getByText(/after Principal signature, Bridge \/ next-step plan, First-term plan, and First-week reviewer will appear on the family status page/i)).toBeInTheDocument();
  expect(screen.getByText(/Family-visible after signature — First-term plan:/i)).toBeInTheDocument();
  expect(screen.getByText(/Family-visible after signature — Bridge:/i)).toBeInTheDocument();
  expect(screen.getByText(/Family-visible after signature — First-week reviewer:/i)).toBeInTheDocument();
});
