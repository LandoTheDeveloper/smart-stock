import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserPreferences {
  dietaryPreferences: string[];
  allergies: string[];
  customAllergies: string;
  avoidIngredients: string;
  calorieTarget: number;
  proteinTarget: number;
  cuisinePreferences: string;
}

export interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verificationEmailLastSent?: Date; // 🔥 was missing from schema
  lastLogin?: Date;
  preferences: IUserPreferences;
  households: mongoose.Types.ObjectId[];
  activeHouseholdId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,
    verificationTokenExpires: Date,
    verificationEmailLastSent: Date,

    lastLogin: Date,

    preferences: {
      dietaryPreferences: { type: [String], default: [] },
      allergies: { type: [String], default: [] },
      customAllergies: { type: String, default: '' },
      avoidIngredients: { type: String, default: '' },
      calorieTarget: { type: Number, default: 0 },
      proteinTarget: { type: Number, default: 0 },
      cuisinePreferences: { type: String, default: '' },
    },

    households: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Household',
      },
    ],

    activeHouseholdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Household',
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });


userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});


userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;