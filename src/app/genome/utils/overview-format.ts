const COMPACT_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const INTEGER_FORMATTER = new Intl.NumberFormat('en-US');

export function formatIntegerCount(value: number): string {
  return INTEGER_FORMATTER.format(value);
}

export function formatCompactCount(value: number): string {
  if (value >= 1_000_000_000) {
    return `${COMPACT_FORMATTER.format(value / 1_000_000_000)}B`;
  }
  if (value >= 1_000_000) {
    return `${COMPACT_FORMATTER.format(value / 1_000_000)}M`;
  }
  if (value >= 1_000) {
    return `${COMPACT_FORMATTER.format(value / 1_000)}K`;
  }
  return INTEGER_FORMATTER.format(value);
}

export function formatGenomeLength(value: number): string {
  if (value >= 1_000_000_000) {
    return `${COMPACT_FORMATTER.format(value / 1_000_000_000)} Gb`;
  }
  if (value >= 1_000_000) {
    return `${COMPACT_FORMATTER.format(value / 1_000_000)} Mb`;
  }
  if (value >= 1_000) {
    return `${COMPACT_FORMATTER.format(value / 1_000)} kb`;
  }
  return `${INTEGER_FORMATTER.format(value)} bp`;
}
