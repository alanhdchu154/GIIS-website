import React from 'react';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import LearnDashboard from './LearnDashboard';

jest.mock('../../../api/authStorage', () => ({
  getStudentSession: () => ({ student: { id: 'student-1', name: 'Test Student' } }),
}));

jest.mock('../../../config/apiBase', () => ({
  getApiBase: () => '',
}));

jest.mock('../../main/Nav.js', () => function MockNav() {
  return <nav>GIIS Nav</nav>;
});

function response(data) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

const completedEnrollment = {
  id: 'enrollment-1',
  creditEarned: true,
  creditEarnedAt: '2026-08-14T12:00:00.000Z',
  semesterLabel: 'Grade 12 - Spring Semester',
  grade: { letter: 'A' },
  quizAttempts: [],
  course: {
    id: 'course-1',
    slug: 'capstone',
    name: 'Capstone',
    nameZh: '毕业专题',
    department: 'Technology',
    type: 'Core',
    credits: 24,
    gradeLevel: 12,
    _count: { modules: 1 },
  },
};

beforeEach(() => {
  global.fetch = jest.fn((url) => {
    const path = String(url);
    if (path.endsWith('/api/enrollments')) return response([completedEnrollment]);
    if (path.endsWith('/api/me')) {
      return response({
        semesters: [{
          courseRows: [{ courseName: 'Capstone', letterGrade: 'A', credits: 24 }],
        }],
      });
    }
    if (path.endsWith('/api/courses')) return response([]);
    return response({});
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('24 total credits creates a review banner, not a diploma-earned claim', async () => {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/learn']}>
        <LearnDashboard language="en" />
      </MemoryRouter>
    </HelmetProvider>
  );

  expect(await screen.findByText('Total-credit threshold reached')).toBeInTheDocument();
  expect(screen.getByText(/Subject-area requirements and staff graduation approval still need review/)).toBeInTheDocument();
  expect(screen.queryByText("You've earned your High School Diploma")).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /View Diploma/i })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Review transcript' })).toHaveAttribute('href', '/transcript');
});
