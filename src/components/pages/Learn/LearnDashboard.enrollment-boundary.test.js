import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
}

const currentEnrollment = {
  id: 'enrollment-1',
  creditEarned: true,
  completedModules: [],
  semesterLabel: 'Grade 9 - Fall Semester',
  grade: {},
  quizAttempts: [],
  course: {
    id: 'course-1', slug: 'algebra-i', name: 'Algebra I', nameZh: '代数 I',
    department: 'Mathematics', type: 'Core', credits: 1, gradeLevel: 9,
    _count: { modules: 14 },
  },
};

const availableCourse = {
  id: 'course-2', slug: 'geometry', name: 'Geometry', nameZh: '几何',
  description: 'A synthetic course fixture.',
  department: 'Mathematics', type: 'Core', credits: 1, gradeLevel: 9,
  _count: { modules: 14 },
};

beforeEach(() => {
  global.fetch = jest.fn((url, options = {}) => {
    const path = String(url);
    if (options.method === 'POST') return response({ error: 'Unexpected POST' });
    if (path.endsWith('/api/enrollments')) return response([currentEnrollment]);
    if (path.endsWith('/api/me')) return response({ semesters: [] });
    if (path.endsWith('/api/courses')) return response([availableCourse]);
    return response({});
  });
});

afterEach(() => jest.restoreAllMocks());

test('course suggestions and catalog are browse-only and never offer student self-enrollment', async () => {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/learn']}>
        <LearnDashboard language="en" />
      </MemoryRouter>
    </HelmetProvider>
  );

  expect(await screen.findByText('Advisor assignment required')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /enroll/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Show catalog' }));
  expect(await screen.findByText('Ask your advisor')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /enroll/i })).not.toBeInTheDocument();
  await waitFor(() => expect(global.fetch.mock.calls.every(([, options]) => options?.method !== 'POST')).toBe(true));
});
