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

export interface LowStockThresholds {
  solid: number;    // in grams
  liquid: number;   // in ml
  countable: number; // count
}

const FALLBACK_THRESHOLDS: LowStockThresholds = {
  solid: 200,
  liquid: 500,
  countable: 2,
};

// Conversion factors to base unit (grams for solid, ml for liquid)
const SOLID_TO_GRAMS: Record<string, number> = {
  g: 1, kg: 1000, oz: 28.3495, lb: 453.592,
};

const LIQUID_TO_ML: Record<string, number> = {
  ml: 1, L: 1000, cups: 236.588, oz: 29.5735, tbsp: 14.787, tsp: 4.929,
};

export function getUnitType(unit: string): UnitType {
  if (SOLID_TO_GRAMS[unit]) return 'solid';
  if (LIQUID_TO_ML[unit]) return 'liquid';
  return 'countable';
}

export function isLowStock(quantity: number, unit: string, thresholds?: LowStockThresholds): boolean {
  const t = thresholds || FALLBACK_THRESHOLDS;
  const unitType = getUnitType(unit);

  if (unitType === 'solid') {
    const inGrams = quantity * (SOLID_TO_GRAMS[unit] || 1);
    return inGrams <= t.solid;
  }
  if (unitType === 'liquid') {
    const inMl = quantity * (LIQUID_TO_ML[unit] || 1);
    return inMl <= t.liquid;
  }
  return quantity <= t.countable;
}

export function getThresholdDisplay(unit: string, thresholds?: LowStockThresholds): string {
  const t = thresholds || FALLBACK_THRESHOLDS;
  const unitType = getUnitType(unit);
  if (unitType === 'solid') return `${t.solid}g`;
  if (unitType === 'liquid') return `${t.liquid}ml`;
  return `${t.countable}`;
}
