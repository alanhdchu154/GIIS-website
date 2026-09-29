import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

test.each([
  ['en', 'Genius Academy', 'Explore Genius Academy', 'https://genius.genesisideas.school/en', /not automatically included in GIIS tuition/],
  ['zh', '杰尼教育 Genius Academy', '了解杰尼教育服务', 'https://genius.genesisideas.school/', /不自动包含在 GIIS 学费内/],
])('partner links and fee boundary follow %s language', (language, heading, link, url, note) => {
  render(<MemoryRouter><Footer language={language} /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: new RegExp(link) })).toHaveAttribute('href', url);
  expect(screen.getByText(note)).toBeInTheDocument();
  expect(screen.getByRole('region', { name: heading })).toHaveAttribute('id', 'education-partner');
});
