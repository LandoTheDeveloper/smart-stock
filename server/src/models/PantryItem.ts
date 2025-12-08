import mongoose, { Document } from 'mongoose';

export interface IMacros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
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
  macros?: IMacros;
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
  macros: {
    type: {
      kcal: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
      serving: { type: String }
    },
    required: false
  }
}, {
  timestamps: true
});

pantryItemSchema.index({ userId: 1, name: 1 });
pantryItemSchema.index({ userId: 1, expirationDate: 1 });
pantryItemSchema.index({ userId: 1, category: 1 });
pantryItemSchema.index({ userId: 1, storageLocation: 1 });

pantryItemSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const PantryItem = mongoose.model<IPantryItem>('PantryItem', pantryItemSchema);

export default PantryItem;
