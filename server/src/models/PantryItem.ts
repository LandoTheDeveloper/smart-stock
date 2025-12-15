import mongoose, { Document } from 'mongoose';

export interface INutrition {
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  serving?: string;
  servingSize?: number;
  servingUnit?: string;
  nutriScore?: string; // A, B, C, D, E
  novaGroup?: number; // 1-4 (food processing level)
}

export const CATEGORIES = [
  'Dairy',
  'Produce',
  'Meat',
  'Seafood',
  'Bakery',
  'Frozen',
  'Canned Goods',
  'Grains & Pasta',
  'Snacks',
  'Beverages',
  'Condiments',
  'Spices',
  'Other'
] as const;

export const STORAGE_LOCATIONS = [
  'Fridge',
  'Freezer',
  'Pantry',
  'Counter'
] as const;

export type Category = typeof CATEGORIES[number];
export type StorageLocation = typeof STORAGE_LOCATIONS[number];

export interface IPantryItem extends Document {
  userId: mongoose.Types.ObjectId;
  householdId?: mongoose.Types.ObjectId;
  createdByUserId?: mongoose.Types.ObjectId;
  createdByName?: string;
  name: string;
  quantity: number;
  unit?: string;
  expirationDate?: Date;
  category?: Category;
  storageLocation?: StorageLocation;
  barcode?: string;
  imageUrl?: string;
  addedDate: Date;
  lastUpdated: Date;
  notes?: string;
  nutrition?: INutrition;
  offCategories?: string[]; // OpenFoodFacts categories for shelf life calculation
  createdAt: Date;
  updatedAt: Date;
}

const pantryItemSchema = new mongoose.Schema<IPantryItem>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  householdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    index: true
  },
  createdByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1
  },
  unit: {
    type: String,
    trim: true
  },
  expirationDate: {
    type: Date
  },
  category: {
    type: String,
    enum: CATEGORIES,
    trim: true
  },
  storageLocation: {
    type: String,
    enum: STORAGE_LOCATIONS,
    default: 'Pantry'
  },
  barcode: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  nutrition: {
    type: {
      kcal: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
      fiber: { type: Number },
      sugar: { type: Number },
      sodium: { type: Number },
      saturatedFat: { type: Number },
      serving: { type: String },
      servingSize: { type: Number },
      servingUnit: { type: String },
      nutriScore: { type: String },
      novaGroup: { type: Number }
    },
    required: false
  },
  offCategories: {
    type: [String],
    default: undefined
  }
}, {
  timestamps: true
});

pantryItemSchema.index({ userId: 1, name: 1 });
pantryItemSchema.index({ userId: 1, expirationDate: 1 });
pantryItemSchema.index({ userId: 1, category: 1 });
pantryItemSchema.index({ userId: 1, storageLocation: 1 });
pantryItemSchema.index({ householdId: 1, name: 1 });
pantryItemSchema.index({ householdId: 1, expirationDate: 1 });

pantryItemSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const PantryItem = mongoose.model<IPantryItem>('PantryItem', pantryItemSchema);

export default PantryItem;
