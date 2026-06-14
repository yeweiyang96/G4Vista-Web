import { canonicalGeneBiotype, geneBiotypeLabel } from './gene-biotype';

describe('gene biotype helpers', () => {
  it('canonicalizes blank and other gene biotypes', () => {
    expect(canonicalGeneBiotype(null)).toBe('other');
    expect(canonicalGeneBiotype(undefined)).toBe('other');
    expect(canonicalGeneBiotype('')).toBe('other');
    expect(canonicalGeneBiotype('   ')).toBe('other');
    expect(canonicalGeneBiotype('other')).toBe('other');
    expect(canonicalGeneBiotype('Other')).toBe('other');
    expect(canonicalGeneBiotype(' protein_coding ')).toBe('protein_coding');
  });

  it('formats the canonical other label for display', () => {
    expect(geneBiotypeLabel(null)).toBe('Other');
    expect(geneBiotypeLabel('')).toBe('Other');
    expect(geneBiotypeLabel('other')).toBe('Other');
    expect(geneBiotypeLabel('protein_coding')).toBe('protein_coding');
  });
});
