import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient {
  name: string;
  amount: string;
}

export interface IRecipe {
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

export interface IMealPlan extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: IRecipe;
  completed: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    name: { type: String, required: true },
    amount: { type: String, required: true }
  },
  { _id: false }
);

const recipeSchema = new Schema<IRecipe>(
  {
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

const mealPlanSchema = new Schema<IMealPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: [true, 'Meal type is required']
    },
    recipe: {
      type: recipeSchema,
      required: [true, 'Recipe is required']
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

mealPlanSchema.index({ userId: 1, date: 1 });
mealPlanSchema.index({ userId: 1, date: 1, mealType: 1 });

export default mongoose.model<IMealPlan>('MealPlan', mealPlanSchema);
