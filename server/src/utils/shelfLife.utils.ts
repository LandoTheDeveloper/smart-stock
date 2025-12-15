/**
 * Shelf Life Utility
 *
 * Provides estimated shelf life (in days) for products based on:
 * 1. Specific product names (exact matches)
 * 2. OpenFoodFacts categories
 * 3. Generic category fallbacks
 */

// Specific product shelf lives (in days from purchase)
// These are estimates for typical storage conditions
const PRODUCT_SHELF_LIVES: Record<string, number> = {
  // Dairy
  'milk': 7,
  'whole milk': 7,
  'skim milk': 7,
  '2% milk': 7,
  'almond milk': 10,
  'oat milk': 10,
  'soy milk': 10,
  'yogurt': 14,
  'greek yogurt': 14,
  'butter': 90,
  'cream cheese': 21,
  'sour cream': 21,
  'heavy cream': 10,
  'cottage cheese': 10,
  'cheese': 30,
  'cheddar cheese': 30,
  'mozzarella': 21,
  'parmesan': 180,

  // Eggs
  'eggs': 28,
  'egg whites': 4,

  // Bread & Bakery
  'bread': 7,
  'white bread': 7,
  'whole wheat bread': 7,
  'bagels': 5,
  'english muffins': 7,
  'tortillas': 14,
  'pita bread': 5,
  'croissants': 3,
  'muffins': 4,

  // Fruits (refrigerated)
  'apples': 28,
  'oranges': 21,
  'bananas': 5,
  'grapes': 7,
  'strawberries': 5,
  'blueberries': 10,
  'raspberries': 3,
  'lemons': 21,
  'limes': 21,
  'avocado': 5,
  'avocados': 5,
  'peaches': 5,
  'pears': 7,
  'watermelon': 14,
  'cantaloupe': 7,
  'pineapple': 5,
  'mango': 5,
  'kiwi': 14,

  // Vegetables (refrigerated)
  'lettuce': 7,
  'spinach': 5,
  'kale': 7,
  'arugula': 5,
  'carrots': 21,
  'celery': 14,
  'broccoli': 7,
  'cauliflower': 7,
  'bell peppers': 10,
  'peppers': 10,
  'tomatoes': 7,
  'cucumbers': 7,
  'zucchini': 7,
  'onions': 30,
  'garlic': 60,
  'potatoes': 21,
  'sweet potatoes': 21,
  'mushrooms': 7,
  'asparagus': 5,
  'green beans': 7,
  'corn': 5,
  'cabbage': 14,

  // Meat (refrigerated, raw)
  'chicken': 2,
  'chicken breast': 2,
  'chicken thighs': 2,
  'ground beef': 2,
  'beef': 3,
  'steak': 3,
  'pork': 3,
  'pork chops': 3,
  'bacon': 7,
  'sausage': 3,
  'turkey': 2,
  'ground turkey': 2,
  'lamb': 3,
  'ham': 5,
  'deli meat': 5,

  // Seafood (refrigerated, raw)
  'fish': 2,
  'salmon': 2,
  'tuna': 2,
  'shrimp': 2,
  'cod': 2,
  'tilapia': 2,
  'crab': 2,
  'lobster': 2,

  // Condiments & Sauces (opened)
  'ketchup': 180,
  'mustard': 365,
  'mayonnaise': 60,
  'salsa': 14,
  'soy sauce': 365,
  'hot sauce': 365,
  'bbq sauce': 120,
  'ranch dressing': 60,
  'salad dressing': 60,
  'olive oil': 365,
  'vegetable oil': 365,

  // Pantry items (opened)
  'peanut butter': 90,
  'jelly': 30,
  'jam': 30,
  'honey': 365,
  'maple syrup': 365,
  'cereal': 180,
  'oatmeal': 180,
  'rice': 365,
  'pasta': 365,
  'flour': 180,
  'sugar': 730,
  'salt': 1825,
  'coffee': 30,
  'tea': 365,

  // Canned goods (opened)
  'canned beans': 4,
  'canned tomatoes': 5,
  'canned soup': 4,
  'canned tuna': 3,
  'canned vegetables': 4,
  'canned fruit': 7,

  // Frozen items
  'frozen vegetables': 240,
  'frozen fruit': 240,
  'frozen pizza': 120,
  'ice cream': 60,
  'frozen meals': 90,

  // Beverages
  'juice': 7,
  'orange juice': 7,
  'apple juice': 7,
  'soda': 90,
  'sparkling water': 365,
};

// OpenFoodFacts category to shelf life mapping
// Categories from OFF are typically formatted like "en:dairy", "en:breads", etc.
const CATEGORY_SHELF_LIVES: Record<string, number> = {
  // Dairy
  'dairy': 14,
  'milks': 7,
  'yogurts': 14,
  'cheeses': 30,
  'butters': 90,
  'creams': 10,
  'milk': 7,
  'yogurt': 14,
  'cheese': 30,
  'butter': 90,
  'cream': 10,

  // Eggs
  'eggs': 28,
  'egg-products': 7,

  // Bread & Baked goods
  'breads': 7,
  'bread': 7,
  'baked-goods': 5,
  'bakery': 5,
  'pastries': 3,
  'cakes': 5,
  'cookies': 14,
  'biscuits': 14,

  // Fruits
  'fruits': 7,
  'fresh-fruits': 7,
  'berries': 5,
  'citrus-fruits': 21,
  'tropical-fruits': 5,
  'dried-fruits': 180,
  'fruit': 7,

  // Vegetables
  'vegetables': 10,
  'fresh-vegetables': 10,
  'leafy-vegetables': 5,
  'root-vegetables': 21,
  'frozen-vegetables': 240,
  'canned-vegetables': 730,
  'vegetable': 10,

  // Meat
  'meats': 3,
  'meat': 3,
  'poultry': 2,
  'beef': 3,
  'pork': 3,
  'lamb': 3,
  'processed-meats': 7,
  'deli': 5,
  'sausages': 5,
  'bacon': 7,
  'cold-cuts': 5,

  // Seafood
  'seafood': 2,
  'fish': 2,
  'shellfish': 2,
  'fresh-fish': 2,
  'smoked-fish': 14,
  'canned-fish': 730,
  'frozen-seafood': 180,

  // Beverages
  'beverages': 30,
  'juices': 7,
  'sodas': 90,
  'waters': 365,
  'alcoholic-beverages': 365,
  'coffee': 30,
  'tea': 365,
  'juice': 7,
  'soda': 90,

  // Condiments
  'condiments': 90,
  'sauces': 30,
  'dressings': 60,
  'oils': 365,
  'vinegars': 730,
  'spices': 730,
  'herbs': 365,
  'sauce': 30,
  'dressing': 60,
  'oil': 365,

  // Snacks
  'snacks': 60,
  'chips': 60,
  'crackers': 90,
  'nuts': 180,
  'dried-snacks': 180,
  'candy': 365,
  'chocolate': 365,

  // Grains & Pasta
  'grains': 365,
  'pasta': 365,
  'rice': 365,
  'cereals': 180,
  'flour': 180,
  'noodles': 365,
  'grain': 365,
  'cereal': 180,

  // Canned & Preserved
  'canned-foods': 730,
  'canned': 730,
  'preserved': 365,
  'pickles': 365,
  'jams': 365,
  'spreads': 90,

  // Frozen
  'frozen': 180,
  'frozen-foods': 180,
  'frozen-meals': 90,
  'ice-cream': 60,
  'frozen-desserts': 60,

  // Baby food
  'baby-foods': 3,
  'baby-food': 3,
  'infant-formula': 30,

  // Pet food
  'pet-food': 30,
  'dog-food': 30,
  'cat-food': 30,
};

// Generic fallback categories (when nothing else matches)
const GENERIC_CATEGORY_FALLBACKS: Record<string, number> = {
  'fresh': 7,
  'refrigerated': 14,
  'frozen': 180,
  'canned': 730,
  'dried': 365,
  'pantry': 180,
  'packaged': 90,
};

// Default shelf life when nothing matches
const DEFAULT_SHELF_LIFE = 14;

/**
 * Normalize a string for matching (lowercase, trim, remove extra spaces)
 */
function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Extract category name from OpenFoodFacts category format
 * e.g., "en:dairy" -> "dairy", "fr:produits-laitiers" -> "produits-laitiers"
 */
function extractCategoryName(category: string): string {
  const parts = category.split(':');
  return parts.length > 1 ? parts[1] : parts[0];
}

/**
 * Get shelf life by product name
 * Returns days from purchase date, or null if not found
 */
export function getShelfLifeByName(productName: string): number | null {
  const normalized = normalize(productName);

  // Try exact match first
  if (PRODUCT_SHELF_LIVES[normalized]) {
    return PRODUCT_SHELF_LIVES[normalized];
  }

  // Try partial matches (product name contains a known product)
  for (const [product, days] of Object.entries(PRODUCT_SHELF_LIVES)) {
    if (normalized.includes(product) || product.includes(normalized)) {
      return days;
    }
  }

  return null;
}

/**
 * Get shelf life by OpenFoodFacts categories
 * Accepts an array of categories and returns the most specific match
 */
export function getShelfLifeByCategories(categories: string[]): number | null {
  if (!categories || categories.length === 0) {
    return null;
  }

  // Try each category
  for (const category of categories) {
    const categoryName = normalize(extractCategoryName(category));

    // Direct match
    if (CATEGORY_SHELF_LIVES[categoryName]) {
      return CATEGORY_SHELF_LIVES[categoryName];
    }

    // Partial match
    for (const [cat, days] of Object.entries(CATEGORY_SHELF_LIVES)) {
      if (categoryName.includes(cat) || cat.includes(categoryName)) {
        return days;
      }
    }
  }

  // Try generic fallbacks
  for (const category of categories) {
    const categoryName = normalize(extractCategoryName(category));
    for (const [generic, days] of Object.entries(GENERIC_CATEGORY_FALLBACKS)) {
      if (categoryName.includes(generic)) {
        return days;
      }
    }
  }

  return null;
}

/**
 * Get suggested expiration date based on product info
 * Priority: product name > categories > default
 * Returns a Date object for the suggested expiration
 */
export function getSuggestedExpirationDate(
  productName?: string,
  categories?: string[]
): Date {
  let shelfLifeDays: number | null = null;

  // Try product name first
  if (productName) {
    shelfLifeDays = getShelfLifeByName(productName);
  }

  // Try categories if no match from name
  if (shelfLifeDays === null && categories && categories.length > 0) {
    shelfLifeDays = getShelfLifeByCategories(categories);
  }

  // Use default if nothing matched
  if (shelfLifeDays === null) {
    shelfLifeDays = DEFAULT_SHELF_LIFE;
  }

  // Calculate expiration date
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);

  return expirationDate;
}

/**
 * Get shelf life in days for a product
 * Returns the number of days, or the default if nothing matches
 */
export function getShelfLifeDays(
  productName?: string,
  categories?: string[]
): number {
  let shelfLifeDays: number | null = null;

  if (productName) {
    shelfLifeDays = getShelfLifeByName(productName);
  }

  if (shelfLifeDays === null && categories && categories.length > 0) {
    shelfLifeDays = getShelfLifeByCategories(categories);
  }

  return shelfLifeDays ?? DEFAULT_SHELF_LIFE;
}

export default {
  getShelfLifeByName,
  getShelfLifeByCategories,
  getSuggestedExpirationDate,
  getShelfLifeDays,
};
