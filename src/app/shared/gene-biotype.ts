export function canonicalGeneBiotype(value: string | null | undefined): string {
  const text = value?.trim() ?? '';
  const normalizedText = text.toLowerCase();
  if (!text || normalizedText === 'other' || normalizedText === 'unspecified gene biotype') {
    return 'other';
  }
  return text;
}

export function geneBiotypeLabel(value: string | null | undefined): string {
  const canonicalValue = canonicalGeneBiotype(value);
  return canonicalValue === 'other' ? 'Other' : canonicalValue;
}
