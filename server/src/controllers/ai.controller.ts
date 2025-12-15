import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PantryItem from '../models/PantryItem';
import User from '../models/User';
import RecipeHistory from '../models/RecipeHistory';
import { getHouseholdContext, buildHouseholdQuery, buildItemAttribution } from '../utils/household.utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GenerateBody {
  prompt: string;
}

interface GenerateRecipesBody {
  userPrompt?: string;
}

export const generateContent = async (
  req: Request<{}, {}, GenerateBody>,
  res: Response
) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required',
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({
      success: true,
      text,
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating content',
    });
  }
};

export const generateRecipes = async (
  req: Request<{}, {}, GenerateRecipesBody>,
  res: Response
) => {
  try {
    const userId = (req as any).userId;
    const { userPrompt } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const context = await getHouseholdContext(userId);
    if (!context) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Fetch user preferences and pantry items in parallel
    const [user, pantryItems] = await Promise.all([
      User.findById(userId),
      PantryItem.find(buildHouseholdQuery(context))
    ]);

    if (pantryItems.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No pantry items found. Please add items to your pantry first.',
      });
    }

    // Filter out expired items and categorize by freshness
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const validItems = pantryItems.filter(item => {
      if (!item.expirationDate) return true;
      return new Date(item.expirationDate) > now;
    });

    if (validItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All pantry items have expired. Please add fresh items to your pantry.',
      });
    }

    // Categorize items by expiration urgency
    const expiringVerySoon: string[] = [];
    const expiringSoon: string[] = [];
    const freshItems: string[] = [];

    validItems.forEach(item => {
      const itemStr = `${item.name} (${item.quantity} ${item.unit || 'unit'})`;
      if (item.expirationDate) {
        const expDate = new Date(item.expirationDate);
        if (expDate <= threeDaysFromNow) {
          expiringVerySoon.push(itemStr);
        } else if (expDate <= sevenDaysFromNow) {
          expiringSoon.push(itemStr);
        } else {
          freshItems.push(itemStr);
        }
      } else {
        freshItems.push(itemStr);
      }
    });

    // Build inventory description with expiration context
    let inventoryDescription = '\n**AVAILABLE PANTRY ITEMS:**';
    if (expiringVerySoon.length > 0) {
      inventoryDescription += `\n- Expiring within 3 days (try to use if it fits the recipe naturally): ${expiringVerySoon.join(', ')}`;
    }
    if (expiringSoon.length > 0) {
      inventoryDescription += `\n- Expiring within 7 days: ${expiringSoon.join(', ')}`;
    }
    if (freshItems.length > 0) {
      inventoryDescription += `\n- Other items: ${freshItems.join(', ')}`;
    }

    // Build user preferences string
    let preferencesPrompt = '';
    if (user?.preferences) {
      const prefs = user.preferences;
      const prefParts: string[] = [];

      if (prefs.dietaryPreferences && prefs.dietaryPreferences.length > 0) {
        prefParts.push(`Dietary preferences: ${prefs.dietaryPreferences.join(', ')}`);
      }

      const allAllergies = [
        ...(prefs.allergies || []),
        ...(prefs.customAllergies ? prefs.customAllergies.split(',').map(a => a.trim()).filter(Boolean) : [])
      ];
      if (allAllergies.length > 0) {
        prefParts.push(`ALLERGIES (MUST AVOID): ${allAllergies.join(', ')}`);
      }

      if (prefs.avoidIngredients) {
        prefParts.push(`Ingredients to avoid: ${prefs.avoidIngredients}`);
      }

      if (prefs.cuisinePreferences) {
        prefParts.push(`Preferred cuisines: ${prefs.cuisinePreferences}`);
      }

      if (prefs.calorieTarget && prefs.calorieTarget > 0) {
        prefParts.push(`Target calories per meal: around ${Math.round(prefs.calorieTarget / 3)} kcal`);
      }

      if (prefs.proteinTarget && prefs.proteinTarget > 0) {
        prefParts.push(`Target protein per meal: around ${Math.round(prefs.proteinTarget / 3)}g`);
      }

      if (prefParts.length > 0) {
        preferencesPrompt = `\n\n**USER PREFERENCES (MUST FOLLOW):**\n${prefParts.join('\n')}`;
      }
    }

    const basePrompt = `You are a helpful cooking assistant. Generate 3-5 REAL recipe suggestions that the user can make.
${inventoryDescription}
${preferencesPrompt}

**IMPORTANT GUIDELINES:**
1. ONLY suggest real, established recipes from actual cuisines (e.g., Chicken Stir Fry, Pasta Carbonara, Beef Tacos, Vegetable Curry). Do NOT invent random combinations.
2. Each recipe should use a SENSIBLE SUBSET of the available ingredients - NOT all of them at once. A typical recipe uses 5-10 ingredients.
3. It's OK if a recipe requires 1-3 common pantry staples not listed (like salt, pepper, oil, garlic, onion, basic spices). Mark these clearly in the ingredients.
4. Prioritize recipes that can use items expiring soon, but ONLY if they fit naturally into a real recipe. Don't force expiring items into incompatible dishes.
5. Suggest VARIED recipes - different cuisines, cooking methods, and meal types.
6. Consider practical cooking - recipes should be achievable for a home cook.

For each recipe, provide:
- Title (name of an actual dish)
- Preparation time in minutes
- Number of servings
- Tags (e.g., quick, breakfast, dinner, vegetarian, cuisine type, etc.)
- Nutritional information (kcal, protein in g, carbs in g, fat in g) - provide realistic estimates
- List of ingredients with amounts (mark items NOT in pantry with "[buy]" suffix)
- Step-by-step cooking instructions

Return the response as a valid JSON array with this exact structure:
[
  {
    "id": "unique-id",
    "title": "Recipe Title",
    "minutes": 30,
    "servings": 2,
    "tags": ["quick", "dinner", "italian"],
    "kcal": 500,
    "protein": 30,
    "carbs": 50,
    "fat": 15,
    "ingredients": [
      {"name": "Ingredient Name", "amount": "100g"},
      {"name": "Onion [buy]", "amount": "1 medium"}
    ],
    "steps": [
      "Step 1 description",
      "Step 2 description"
    ]
  }
]`;

    const finalPrompt = userPrompt
      ? `${basePrompt}\n\n**ADDITIONAL REQUIREMENT**: You MUST also follow this requirement strictly: ${userPrompt}. Do not suggest any recipes that don't meet this requirement.`
      : basePrompt;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();

    let recipes;
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      recipes = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', text);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse recipe data from AI response',
      });
    }

    // Save to history with household attribution
    await RecipeHistory.create({
      ...buildItemAttribution(context),
      prompt: userPrompt || undefined,
      recipes
    });

    res.json({
      success: true,
      recipes,
    });
  } catch (error: any) {
    console.error('Generate Recipes Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recipes',
      error: error.message,
    });
  }
};
