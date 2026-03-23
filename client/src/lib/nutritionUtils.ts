export type FoodGroup =
  | 'Grains'
  | 'Vegetables'
  | 'Fruits'
  | 'Protein'
  | 'Dairy'
  | 'Fats & Sweets';

const FOOD_GROUP_KEYWORDS: Record<FoodGroup, string[]> = {
  Grains: [
    'rice', 'bread', 'pasta', 'noodle', 'flour', 'oat', 'cereal', 'wheat',
    'tortilla', 'pita', 'couscous', 'quinoa', 'barley', 'cornmeal',
    'cracker', 'bagel', 'roll', 'bun', 'muffin', 'pancake', 'waffle',
    'spaghetti', 'macaroni', 'fettuccine', 'penne', 'ramen', 'udon',
    'sourdough', 'flatbread', 'naan', 'rye', 'biscuit', 'grits',
  ],
  Vegetables: [
    'broccoli', 'carrot', 'spinach', 'lettuce', 'tomato', 'onion', 'garlic',
    'pepper', 'celery', 'cucumber', 'zucchini', 'squash', 'potato', 'sweet potato',
    'mushroom', 'cabbage', 'kale', 'cauliflower', 'asparagus', 'green bean',
    'pea', 'artichoke', 'beet', 'radish', 'turnip', 'eggplant', 'leek',
    'corn', 'okra', 'chard', 'arugula', 'scallion', 'shallot', 'ginger',
    'jalape', 'bell pepper', 'bok choy', 'edamame', 'brussels sprout',
  ],
  Fruits: [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'strawberry',
    'blueberry', 'raspberry', 'grape', 'melon', 'watermelon', 'mango',
    'pineapple', 'peach', 'pear', 'plum', 'cherry', 'kiwi', 'coconut',
    'avocado', 'fig', 'date', 'raisin', 'cranberry', 'pomegranate',
    'papaya', 'apricot', 'nectarine', 'grapefruit', 'tangerine',
  ],
  Protein: [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'fish', 'salmon', 'tuna',
    'shrimp', 'tofu', 'egg', 'lentil', 'bean', 'chickpea', 'sausage',
    'bacon', 'ham', 'steak', 'ground beef', 'ground turkey',
    'tempeh', 'seitan', 'duck', 'veal', 'venison', 'crab', 'lobster',
    'mussel', 'clam', 'scallop', 'squid', 'anchovy', 'sardine',
    'cod', 'tilapia', 'halibut', 'trout', 'catfish',
    'black bean', 'kidney bean', 'pinto bean', 'nut', 'almond',
    'walnut', 'pecan', 'cashew', 'peanut', 'pistachio', 'seed',
    'protein powder',
  ],
  Dairy: [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream',
    'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'ricotta',
    'cottage cheese', 'gouda', 'brie', 'swiss', 'provolone',
    'goat cheese', 'blue cheese', 'mascarpone', 'ghee', 'kefir',
    'buttermilk', 'whipped cream', 'half and half',
  ],
  'Fats & Sweets': [
    'oil', 'olive oil', 'vegetable oil', 'canola oil', 'sesame oil',
    'coconut oil', 'lard', 'margarine', 'shortening', 'mayo', 'mayonnaise',
    'sugar', 'honey', 'syrup', 'chocolate', 'candy', 'cake', 'cookie',
    'ice cream', 'jam', 'jelly', 'molasses', 'agave', 'maple syrup',
    'caramel', 'dressing', 'ranch', 'vinaigrette',
    'ketchup', 'barbecue sauce', 'teriyaki', 'soy sauce', 'hot sauce',
    'sriracha', 'mustard', 'worcestershire',
  ],
};

export const FOOD_GROUP_COLORS: Record<FoodGroup, string> = {
  Grains: '#F59E0B',
  Vegetables: '#22C55E',
  Fruits: '#EF4444',
  Protein: '#8B5CF6',
  Dairy: '#3B82F6',
  'Fats & Sweets': '#F97316',
};

export const FOOD_GROUP_ORDER: FoodGroup[] = [
  'Grains',
  'Vegetables',
  'Fruits',
  'Protein',
  'Dairy',
  'Fats & Sweets',
];

export function classifyIngredient(ingredientName: string): FoodGroup {
  const lower = ingredientName.toLowerCase().trim();
  const groupOrder: FoodGroup[] = ['Dairy', 'Protein', 'Fruits', 'Vegetables', 'Grains', 'Fats & Sweets'];
  for (const group of groupOrder) {
    for (const keyword of FOOD_GROUP_KEYWORDS[group]) {
      if (lower.includes(keyword)) return group;
    }
  }
  return 'Fats & Sweets';
}

export interface MealPlanInput {
  date: string;
  recipe: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: { name: string; amount: string }[];
  };
}

export interface WeeklyMacros {
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  dailyAverageKcal: number;
  dailyAverageProtein: number;
  dailyAverageCarbs: number;
  dailyAverageFat: number;
}

export function computeWeeklyMacros(mealPlans: MealPlanInput[]): WeeklyMacros {
  let totalKcal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  for (const meal of mealPlans) {
    totalKcal += meal.recipe.kcal || 0;
    totalProtein += meal.recipe.protein || 0;
    totalCarbs += meal.recipe.carbs || 0;
    totalFat += meal.recipe.fat || 0;
  }
  const daysWithMeals = new Set(
    mealPlans.map(m => new Date(m.date).toISOString().split('T')[0])
  ).size;
  const divisor = Math.max(daysWithMeals, 1);
  return {
    totalKcal: Math.round(totalKcal),
    totalProtein: Math.round(totalProtein),
    totalCarbs: Math.round(totalCarbs),
    totalFat: Math.round(totalFat),
    dailyAverageKcal: Math.round(totalKcal / divisor),
    dailyAverageProtein: Math.round(totalProtein / divisor),
    dailyAverageCarbs: Math.round(totalCarbs / divisor),
    dailyAverageFat: Math.round(totalFat / divisor),
  };
}

export interface FoodGroupDistribution {
  group: FoodGroup;
  count: number;
  percentage: number;
  color: string;
}

export function computeFoodGroupDistribution(mealPlans: MealPlanInput[]): FoodGroupDistribution[] {
  const counts: Record<FoodGroup, number> = {
    Grains: 0, Vegetables: 0, Fruits: 0,
    Protein: 0, Dairy: 0, 'Fats & Sweets': 0,
  };
  let total = 0;
  for (const meal of mealPlans) {
    for (const ingredient of meal.recipe.ingredients || []) {
      const group = classifyIngredient(ingredient.name);
      counts[group]++;
      total++;
    }
  }
  return FOOD_GROUP_ORDER.map(group => ({
    group,
    count: counts[group],
    percentage: total > 0 ? Math.round((counts[group] / total) * 100) : 0,
    color: FOOD_GROUP_COLORS[group],
  }));
}
