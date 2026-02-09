// backend/src/models/Feedback.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  type: 'bug' | 'ui' | 'workflow' | 'feature';
  title: string;
  description: string;
  email?: string;
  userAgent?: string;
  screenResolution?: string;
  status: 'new' | 'in-progress' | 'resolved' | 'closed' | 'wont-fix';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    type: {
      type: String,
      required: true,
      enum: ['bug', 'ui', 'workflow', 'feature'],
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    userAgent: {
      type: String,
    },
    screenResolution: {
      type: String,
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved', 'closed', 'wont-fix'],
      default: 'new',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ type: 1, status: 1 });

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);