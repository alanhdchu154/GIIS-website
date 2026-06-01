import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import ModulePage from './ModulePage';

jest.mock('../../../api/authStorage', () => ({
  getStudentSession: () => ({ student: { id: 'student-1', name: 'Test Student' } }),
}));

jest.mock('../../../config/apiBase', () => ({
  getApiBase: () => '',
}));

jest.mock('../../main/Nav.js', () => function MockNav() {
  return <nav>GIIS Nav</nav>;
});

jest.mock('../../main/LessonVideoEmbed', () => function MockLessonVideoEmbed() {
  return null;
});

function response(data) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function deferredResponse(data) {
  let resolve;
  const promise = new Promise((done) => {
    resolve = () => done({
      ok: true,
      json: () => Promise.resolve(data),
    });
  });
  return { promise, resolve };
}

const modules = [
  {
    order: 1,
    title: 'Reading Comprehension Strategies',
    titleZh: '阅读理解策略',
    objectives: 'Read closely.',
    assignment: 'Old module assignment should disappear.',
    estimatedHrs: 3,
  },
  {
    order: 3,
    title: 'Sentence Structure & Syntax',
    titleZh: '句子结构与句法',
    objectives: 'Write stronger sentences.',
    assignment: 'New module assignment is visible.',
    estimatedHrs: 3,
  },
];

function enrollmentPayload(moduleOrder) {
  return {
    course: { name: 'English I', nameZh: '英语一', department: 'English', modules },
    enrollment: {
      quizAttempts: [{ moduleOrder, score: 85, passed: true, answers: {} }],
      assignments: moduleOrder === 1
        ? [{ moduleOrder: 1, content: 'Old saved assignment.' }]
        : [{ moduleOrder: 3, content: 'New saved assignment.' }],
      moduleProgresses: [],
    },
  };
}

function JumpToModuleThree() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/learn/english-i/module/3')}>Jump to module 3</button>;
}

test('does not show stale quiz or assignment content after a fast module switch', async () => {
  const slowOldQuiz = deferredResponse({
    questions: [{ id: 'old-q', question: 'Old module quiz question', answer: 'Old', explanation: 'Old explanation', points: 1 }],
  });

  global.fetch = jest.fn((url) => {
    const target = String(url);
    if (target.includes('/api/enrollments/english-i/quiz/1')) return slowOldQuiz.promise;
    if (target.includes('/api/enrollments/english-i/quiz/3')) {
      return response({
        questions: [{ id: 'new-q', question: 'New module quiz question', answer: 'New', explanation: 'New explanation', points: 1 }],
      });
    }
    if (target.includes('/api/enrollments/english-i')) {
      const loadCount = global.fetch.mock.calls.filter(([calledUrl]) => String(calledUrl).includes('/api/enrollments/english-i') && !String(calledUrl).includes('/quiz/')).length;
      return response(enrollmentPayload(loadCount === 1 ? 1 : 3));
    }
    return response({});
  });

  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/learn/english-i/module/1']}>
        <JumpToModuleThree />
        <Routes>
          <Route path="/learn/:slug/module/:order" element={<ModulePage language="en" />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

  expect(await screen.findByText('Reading Comprehension Strategies')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Old saved assignment.')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Jump to module 3'));

  await waitFor(() => {
    expect(screen.queryByDisplayValue('Old saved assignment.')).not.toBeInTheDocument();
  });

  expect(await screen.findByText('Sentence Structure & Syntax')).toBeInTheDocument();
  expect(screen.getByDisplayValue('New saved assignment.')).toBeInTheDocument();

  await act(async () => {
    slowOldQuiz.resolve();
  });

  await waitFor(() => {
    expect(screen.queryByText('Old module quiz question')).not.toBeInTheDocument();
  });
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/enrollments/english-i/quiz/3'),
    expect.any(Object)
  );
});
