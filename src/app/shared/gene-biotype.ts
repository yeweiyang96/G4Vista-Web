export function canonicalGeneBiotype(value: string | null | undefined): string {
  const text = value?.trim() ?? '';
  if (!text || text.toLowerCase() === 'other') {
    return 'other';
  }
  return text;
}

export function geneBiotypeLabel(value: string | null | undefined): string {
  const canonicalValue = canonicalGeneBiotype(value);
  return canonicalValue === 'other' ? 'Other' : canonicalValue;
}
