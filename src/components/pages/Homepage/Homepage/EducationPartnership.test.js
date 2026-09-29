import React from 'react';
import { render, screen } from '@testing-library/react';
import EducationPartnership from './EducationPartnership';

test.each([
  ['en', 'Plan beyond graduation.', 'Explore personal university planning', 'https://genius.genesisideas.school/en', /not automatically included in GIIS tuition/],
  ['zh', '从高中学习，走向更广阔的世界。', '了解私人升学规划', 'https://genius.genesisideas.school/', /不自动包含在 GIIS 学费内/],
])('homepage partnership has clear roles, scope and destination in %s', (language, heading, link, url, note) => {
  render(<EducationPartnership language={language} />);
  expect(screen.getByRole('region', { name: heading })).toHaveAttribute('id', 'education-partner');
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getAllByRole('img')).toHaveLength(2);
  expect(screen.getByRole('link', { name: new RegExp(link) })).toHaveAttribute('href', url);
  expect(screen.getByText(note)).toBeInTheDocument();
});
