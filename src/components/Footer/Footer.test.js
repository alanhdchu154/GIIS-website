import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

test.each([
  ['en', 'Genius Academy', 'https://genius.genesisideas.school/en'],
  ['zh', '杰尼教育 Genius Academy', 'https://genius.genesisideas.school/'],
])('footer keeps only a compact %s partner link', (language, link, url) => {
  render(<MemoryRouter><Footer language={language} /></MemoryRouter>);
  expect(screen.getByRole('link', { name: new RegExp(link) })).toHaveAttribute('href', url);
  expect(document.querySelector('#education-partner')).toBeNull();
});
