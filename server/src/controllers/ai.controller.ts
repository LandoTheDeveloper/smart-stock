import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PantryItem from '../models/PantryItem';
import User from '../models/User';

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

    // Fetch user preferences and pantry items in parallel
    const [user, pantryItems] = await Promise.all([
      User.findById(userId),
      PantryItem.find({ userId })
    ]);

    if (pantryItems.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No pantry items found. Please add items to your pantry first.',
      });
    }

    const inventoryList = pantryItems
      .map((item) => `${item.name} (${item.quantity} ${item.unit || 'unit'})`)
      .join(', ');

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

    const basePrompt = `Generate 3-5 recipe suggestions based on the following pantry inventory: ${inventoryList}.${preferencesPrompt}

For each recipe, provide:
- Title
- Preparation time in minutes
- Number of servings
- Tags (e.g., quick, breakfast, dinner, vegetarian, etc.)
- Nutritional information (kcal, protein in g, carbs in g, fat in g)
- List of ingredients with amounts
- Step-by-step cooking instructions

Return the response as a valid JSON array with this exact structure:
[
  {
    "id": "unique-id",
    "title": "Recipe Title",
    "minutes": 30,
    "servings": 2,
    "tags": ["quick", "dinner"],
    "kcal": 500,
    "protein": 30,
    "carbs": 50,
    "fat": 15,
    "ingredients": [
      {"name": "Ingredient Name", "amount": "100g"}
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
