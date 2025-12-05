import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient {
  name: string;
  amount: string;
}

export interface ISavedRecipe extends Document {
  userId: mongoose.Types.ObjectId;
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
  isFavorite: boolean;
  isCustom: boolean;
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

const savedRecipeSchema = new Schema<ISavedRecipe>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    minutes: {
      type: Number,
      required: true
    },
    servings: {
      type: Number,
      required: true
    },
    tags: [{ type: String }],
    kcal: {
      type: Number,
      required: true
    },
    protein: {
      type: Number,
      required: true
    },
    carbs: {
      type: Number,
      required: true
    },
    fat: {
      type: Number,
      required: true
    },
    ingredients: [ingredientSchema],
    steps: [{ type: String }],
    isFavorite: {
      type: Boolean,
      default: false
    },
    isCustom: {
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

savedRecipeSchema.index({ userId: 1, isFavorite: 1 });
savedRecipeSchema.index({ userId: 1, title: 1 });

export default mongoose.model<ISavedRecipe>('SavedRecipe', savedRecipeSchema);
