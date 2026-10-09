const fs = require('fs');
const path = require('path');

describe('Application persistence contract', () => {
  test('provides the updatedAt revision used by approval and placement compare-and-set writes', () => {
    const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const applicationModel = schema.match(/model Application \{([\s\S]*?)\n\}/)?.[1] || '';

    expect(applicationModel).toMatch(
      /\n\s+updatedAt\s+DateTime\s+@default\(now\(\)\)\s+@updatedAt\s*(?:\n|$)/,
    );
  });
});
