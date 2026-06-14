import { formatCompactCount, formatGenomeLength, formatIntegerCount } from './overview-format';

describe('overview format utilities', () => {
  it('keeps full table counts separate from compact summary counts', () => {
    expect(formatIntegerCount(1_234_567)).toBe('1,234,567');
    expect(formatCompactCount(1_234_567)).toBe('1.2M');
  });

  it('keeps genome length units explicit', () => {
    expect(formatGenomeLength(1_234_567)).toBe('1.2 Mb');
  });
});
