import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient {
  name: string;
  amount: string;
}

export interface IRecipeHistoryItem {
  id: string;
  title: string;
  minutes: number;
  servings: number;
  tags: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: IIngredient[];
  steps: string[];
}

export interface IRecipeHistory extends Document {
  userId: mongoose.Types.ObjectId;
  prompt?: string;
  recipes: IRecipeHistoryItem[];
  createdAt: Date;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    name: { type: String, required: true },
    amount: { type: String, required: true }
  },
  { _id: false }
);

const recipeItemSchema = new Schema<IRecipeHistoryItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    minutes: { type: Number, required: true },
    servings: { type: Number, required: true },
    tags: [{ type: String }],
    kcal: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    ingredients: [ingredientSchema],
    steps: [{ type: String }]
  },
  { _id: false }
);

const recipeHistorySchema = new Schema<IRecipeHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    prompt: {
      type: String,
      trim: true
    },
    recipes: [recipeItemSchema]
  },
  {
    timestamps: true
  }
);

recipeHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IRecipeHistory>('RecipeHistory', recipeHistorySchema);
