import User from '../models/User';
import mongoose from 'mongoose';

export interface HouseholdContext {
  userId: string;
  householdId?: mongoose.Types.ObjectId;
  userName: string;
}

/**
 * Get the household context for a user.
 * Returns the user's ID, active household ID (if any), and name.
 */
export async function getHouseholdContext(userId: string): Promise<HouseholdContext | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  return {
    userId,
    householdId: user.activeHouseholdId,
    userName: user.name
  };
}

/**
 * Build a query filter that respects household membership.
 * If user has an active household, query by householdId.
 * Otherwise, query by userId for personal items.
 */
export function buildHouseholdQuery(context: HouseholdContext): Record<string, any> {
  if (context.householdId) {
    return { householdId: context.householdId };
  }
  return { userId: context.userId, householdId: { $exists: false } };
}

/**
 * Build the attribution fields for new items.
 */
export function buildItemAttribution(context: HouseholdContext): Record<string, any> {
  return {
    userId: context.userId,
    householdId: context.householdId || undefined,
    createdByUserId: context.userId,
    createdByName: context.userName
  };
}
