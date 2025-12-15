import mongoose, { Document, Schema } from 'mongoose';

export interface IShoppingListItem extends Document {
  userId: mongoose.Types.ObjectId;
  householdId?: mongoose.Types.ObjectId;
  createdByUserId?: mongoose.Types.ObjectId;
  createdByName?: string;
  name: string;
  quantity: number;
  unit?: string;
  checked: boolean;
  pantryItemId?: mongoose.Types.ObjectId;
  category?: string;
  priority: 'low' | 'normal' | 'high';
  addedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shoppingListItemSchema = new Schema<IShoppingListItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
      index: true,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdByName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      trim: true,
    },
    checked: {
      type: Boolean,
      default: false,
    },
    pantryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'PantryItem',
    },
    category: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    addedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

shoppingListItemSchema.index({ userId: 1, checked: 1 });
shoppingListItemSchema.index({ userId: 1, category: 1 });
shoppingListItemSchema.index({ householdId: 1, checked: 1 });

export default mongoose.model<IShoppingListItem>('ShoppingListItem', shoppingListItemSchema);
