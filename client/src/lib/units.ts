export const UNITS = [
  'count', 'g', 'kg', 'ml', 'L', 'oz', 'lb',
  'cups', 'tbsp', 'tsp', 'pcs', 'pack', 'box',
  'can', 'bottle', 'bag',
] as const;

export const SOLID_UNITS = ['g', 'kg', 'oz', 'lb'] as const;
export const LIQUID_UNITS = ['ml', 'L', 'cups', 'oz', 'tbsp', 'tsp'] as const;
export const COUNTABLE_UNITS = ['count', 'pcs', 'pack', 'box', 'can', 'bottle', 'bag'] as const;

export type UnitType = 'solid' | 'liquid' | 'countable';

export interface DefaultUnits {
  solid: string;
  liquid: string;
  countable: string;
}

const CATEGORY_UNIT_TYPE: Record<string, UnitType> = {
  'Dairy': 'solid',
  'Produce': 'solid',
  'Meat': 'solid',
  'Seafood': 'solid',
  'Grains & Pasta': 'solid',
  'Spices': 'solid',
  'Beverages': 'liquid',
  'Condiments': 'liquid',
  'Bakery': 'countable',
  'Frozen': 'countable',
  'Canned Goods': 'countable',
  'Snacks': 'countable',
  'Other': 'countable',
};

const FALLBACK_DEFAULTS: DefaultUnits = {
  solid: 'g',
  liquid: 'ml',
  countable: 'count',
};

export function getDefaultUnit(category: string | undefined, prefs?: DefaultUnits): string {
  const unitType = CATEGORY_UNIT_TYPE[category || ''] || 'countable';
  const defaults = prefs || FALLBACK_DEFAULTS;
  return defaults[unitType];
}
