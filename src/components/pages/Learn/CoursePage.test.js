import React from 'react';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CoursePage from './CoursePage';

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

const coursePayload = {
  course: {
    name: 'English I',
    nameZh: '英语一',
    department: 'English',
    type: 'College Prep',
    description: 'A foundational English course.',
    modules: [
      { id: 'm1', order: 1, title: 'Reading Closely', titleZh: '细读', estimatedHrs: 3 },
      { id: 'm2', order: 2, title: 'Writing Clearly', titleZh: '清晰写作', estimatedHrs: 3 },
    ],
  },
  enrollment: {
    quizAttempts: [{ moduleOrder: 1, score: 88, passed: true }],
    assignments: [],
    examAttempts: [],
  },
};

test('shows when a completed quiz still needs the module assignment', async () => {
  global.fetch = jest.fn((url) => {
    if (String(url).includes('/api/enrollments/english-i')) return response(coursePayload);
    return response({});
  });

  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/learn/english-i']}>
        <Routes>
          <Route path="/learn/:slug" element={<CoursePage language="en" />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

  expect(await screen.findByText('Reading Closely')).toBeInTheDocument();
  expect(screen.getByText('Quiz complete')).toBeInTheDocument();
  expect(screen.getByText('Assignment needed')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Submit work/ })).toHaveAttribute('href', '/learn/english-i/module/1');
});
