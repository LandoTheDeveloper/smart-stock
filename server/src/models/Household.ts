import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IHouseholdMember {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'member';
  joinedAt: Date;
  name: string;
}

export interface IHousehold extends Document {
  name: string;
  inviteCode: string;
  inviteCodeExpiresAt: Date;
  createdBy: mongoose.Types.ObjectId;
  members: IHouseholdMember[];
  createdAt: Date;
  updatedAt: Date;
}

const householdMemberSchema = new Schema<IHouseholdMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    required: true
  }
}, { _id: false });

const householdSchema = new Schema<IHousehold>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  inviteCodeExpiresAt: {
    type: Date,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [householdMemberSchema]
}, {
  timestamps: true
});

// Index for efficient lookups
householdSchema.index({ inviteCode: 1 });
householdSchema.index({ 'members.userId': 1 });
householdSchema.index({ createdBy: 1 });

// Generate a unique 8-character invite code
export function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Get expiry date (24 hours from now by default)
export function getInviteCodeExpiry(hours: number = 24): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}

const Household = mongoose.model<IHousehold>('Household', householdSchema);

export default Household;
