import { G4PositionCategory, G4PositionStatisticsCategory } from '../../../services/g4.service';

export interface PositionCategoryView extends G4PositionCategory {
  color: string;
  displayLabel: string;
  displayDescription: string;
}

export interface PositionStatisticsCategoryView extends G4PositionStatisticsCategory {
  color: string;
  displayLabel: string;
  displayDescription: string;
}

interface PositionCategoryTextSource {
  key: string;
  label: string;
  description?: string;
  display_label?: string;
  display_description?: string;
}

export const DEFAULT_POSITION_CATEGORY_KEYS: readonly string[] = [
  'gene_inside',
  'gene_upstream',
  'gene_downstream',
  'other',
];

export const POSITION_CATEGORY_COLORS: Record<string, string> = {
  gene_inside: '#07879a',
  gene_upstream: '#8ec8ef',
  gene_downstream: '#8ab84e',
  other: '#a8adb7',
};

const DEFAULT_POSITION_CATEGORY_KEY_SET: ReadonlySet<string> = new Set<string>(
  DEFAULT_POSITION_CATEGORY_KEYS,
);
const FALLBACK_POSITION_CATEGORY_COLOR = '#5f6368';
const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  style: 'percent',
});

export function formatCount(value: number): string {
  return COUNT_FORMATTER.format(value);
}

export function formatRatio(value: number): string {
  return PERCENT_FORMATTER.format(value);
}

export function formatNullableNumber(value: number | null): string {
  return value === null ? 'N/A' : NUMBER_FORMATTER.format(value);
}

export function formatNullableNumberWithSuffix(value: number | null, suffix: string): string {
  return value === null ? 'N/A' : `${NUMBER_FORMATTER.format(value)}${suffix}`;
}

export function categoryCount(categories: readonly G4PositionCategory[], key: string): number {
  return categories.find((category) => category.key === key)?.count ?? 0;
}

export function isDefaultPositionCategory(
  category: Pick<G4PositionCategory, 'key' | 'is_default_chart_category'>,
): boolean {
  if (!DEFAULT_POSITION_CATEGORY_KEY_SET.has(category.key)) {
    return false;
  }
  return category.is_default_chart_category ?? true;
}

export function categoryDisplayText(category: PositionCategoryTextSource): {
  displayLabel: string;
  displayDescription: string;
} {
  const apiDisplayLabel = category.display_label?.trim();
  const apiDisplayDescription = category.display_description?.trim();
  if (apiDisplayLabel && apiDisplayDescription) {
    return {
      displayLabel: apiDisplayLabel,
      displayDescription: apiDisplayDescription,
    };
  }

  switch (category.key) {
    case 'gene_inside':
      return {
        displayLabel: 'In genes',
        displayDescription: 'Predicted motif sites that fall within annotated gene intervals.',
      };
    case 'gene_upstream':
      return {
        displayLabel: 'Upstream flank',
        displayDescription: 'Predicted motif sites in the selected upstream gene flank.',
      };
    case 'gene_downstream':
      return {
        displayLabel: 'Downstream flank',
        displayDescription: 'Predicted motif sites in the selected downstream gene flank.',
      };
    case 'other':
      return {
        displayLabel: 'Other',
        displayDescription: 'Predicted motif sites outside genes and selected gene flanks.',
      };
    default:
      return {
        displayLabel: apiDisplayLabel ?? category.label,
        displayDescription: apiDisplayDescription ?? category.description ?? category.label,
      };
  }
}

export function summaryChartLabel(category: Pick<G4PositionCategory, 'key' | 'label'>): string {
  switch (category.key) {
    case 'gene_inside':
      return 'In genes';
    case 'gene_upstream':
      return 'Upstream flank';
    case 'gene_downstream':
      return 'Downstream flank';
    case 'other':
      return 'Other';
    default:
      return category.label;
  }
}

export function positionCategoryColor(key: string): string {
  return POSITION_CATEGORY_COLORS[key] ?? FALLBACK_POSITION_CATEGORY_COLOR;
}

export function defaultPositionCategoryViews(
  categories: readonly G4PositionCategory[],
): readonly PositionCategoryView[] {
  const defaultCategories = categories
    .filter((category) => isDefaultPositionCategory(category))
    .sort((left, right) => {
      const leftOrder = left.display_order ?? left.precedence_rank;
      const rightOrder = right.display_order ?? right.precedence_rank;
      return leftOrder - rightOrder;
    });
  return defaultCategories.map((category) => {
    const displayText = categoryDisplayText(category);
    return {
      ...category,
      ...displayText,
      color: positionCategoryColor(category.key),
    };
  });
}

export function defaultPositionStatisticsCategoryViews(
  categories: readonly G4PositionStatisticsCategory[],
  selectedCategoryKeys: readonly string[],
): readonly PositionStatisticsCategoryView[] {
  const selectedKeys = new Set(selectedCategoryKeys);
  return categories
    .filter((category) => isDefaultPositionCategory(category))
    .filter((category) => selectedKeys.has(category.key))
    .sort((left, right) => {
      const leftOrder =
        left.display_order ?? left.precedence_rank ?? DEFAULT_POSITION_CATEGORY_KEYS.length;
      const rightOrder =
        right.display_order ?? right.precedence_rank ?? DEFAULT_POSITION_CATEGORY_KEYS.length;
      return leftOrder - rightOrder;
    })
    .map((category) => {
      const displayText = categoryDisplayText(category);
      return {
        ...category,
        ...displayText,
        color: positionCategoryColor(category.key),
      };
    });
}
