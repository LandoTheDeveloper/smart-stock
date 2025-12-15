import { Request, Response } from 'express';
import Household, { generateInviteCode, getInviteCodeExpiry } from '../models/Household';
import User from '../models/User';

// Create a new household
export const createHousehold = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Household name is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (await Household.findOne({ inviteCode }) && attempts < 10) {
      inviteCode = generateInviteCode();
      attempts++;
    }

    const household = new Household({
      name: name.trim(),
      inviteCode,
      inviteCodeExpiresAt: getInviteCodeExpiry(24),
      createdBy: userId,
      members: [{
        userId,
        role: 'owner',
        joinedAt: new Date(),
        name: user.name
      }]
    });

    await household.save();

    // Add household to user's households and set as active
    user.households = user.households || [];
    user.households.push(household._id as any);
    user.activeHouseholdId = household._id as any;
    await user.save();

    res.status(201).json({
      success: true,
      data: household,
      message: 'Household created successfully'
    });
  } catch (error: any) {
    console.error('Error creating household:', error);
    res.status(500).json({ success: false, message: 'Failed to create household', error: error.message });
  }
};

// Get active household
export const getActiveHousehold = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || !user.activeHouseholdId) {
      return res.json({ success: true, data: null });
    }

    const household = await Household.findById(user.activeHouseholdId);
    if (!household) {
      return res.json({ success: true, data: null });
    }

    // Find user's role in this household
    const memberInfo = household.members.find(m => m.userId.toString() === userId);

    res.json({
      success: true,
      data: {
        ...household.toObject(),
        userRole: memberInfo?.role || 'member'
      }
    });
  } catch (error: any) {
    console.error('Error fetching active household:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch household', error: error.message });
  }
};

// Get all households user belongs to
export const getAllHouseholds = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const households = await Household.find({
      'members.userId': userId
    });

    const householdsWithRole = households.map(h => {
      const memberInfo = h.members.find(m => m.userId.toString() === userId);
      return {
        _id: h._id,
        name: h.name,
        role: memberInfo?.role || 'member',
        memberCount: h.members.length
      };
    });

    res.json({ success: true, data: householdsWithRole });
  } catch (error: any) {
    console.error('Error fetching households:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch households', error: error.message });
  }
};

// Update household
export const updateHousehold = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const household = await Household.findById(id);
    if (!household) {
      return res.status(404).json({ success: false, message: 'Household not found' });
    }

    // Check if user is owner
    const memberInfo = household.members.find(m => m.userId.toString() === userId);
    if (!memberInfo || memberInfo.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can update household settings' });
    }

    if (name) {
      household.name = name.trim();
    }

    await household.save();

    res.json({ success: true, data: household, message: 'Household updated' });
  } catch (error: any) {
    console.error('Error updating household:', error);
    res.status(500).json({ success: false, message: 'Failed to update household', error: error.message });
  }
};

// Join household via invite code
export const joinHousehold = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { inviteCode } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const household = await Household.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!household) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    // Check if code is expired
    if (new Date() > household.inviteCodeExpiresAt) {
      return res.status(400).json({ success: false, message: 'Invite code has expired' });
    }

    // Check if user is already a member
    const existingMember = household.members.find(m => m.userId.toString() === userId);
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this household' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add user to household
    household.members.push({
      userId,
      role: 'member',
      joinedAt: new Date(),
      name: user.name
    });
    await household.save();

    // Add household to user's list and set as active
    user.households = user.households || [];
    user.households.push(household._id as any);
    user.activeHouseholdId = household._id as any;
    await user.save();

    res.json({
      success: true,
      data: household,
      message: `You have joined "${household.name}"`
    });
  } catch (error: any) {
    console.error('Error joining household:', error);
    res.status(500).json({ success: false, message: 'Failed to join household', error: error.message });
  }
};

// Leave household
export const leaveHousehold = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const household = await Household.findById(id);
    if (!household) {
      return res.status(404).json({ success: false, message: 'Household not found' });
    }

    const memberIndex = household.members.findIndex(m => m.userId.toString() === userId);
    if (memberIndex === -1) {
      return res.status(400).json({ success: false, message: 'You are not a member of this household' });
    }

    const isOwner = household.members[memberIndex].role === 'owner';

    // If owner is leaving and there are other members, transfer ownership
    if (isOwner && household.members.length > 1) {
      const newOwner = household.members.find(m => m.userId.toString() !== userId);
      if (newOwner) {
        newOwner.role = 'owner';
      }
    }

    // Remove user from household
    household.members.splice(memberIndex, 1);

    // If no members left, delete the household
    if (household.members.length === 0) {
      await Household.deleteOne({ _id: id });
    } else {
      await household.save();
    }

    // Remove household from user's list
    const user = await User.findById(userId);
    if (user) {
      user.households = (user.households || []).filter(h => h.toString() !== id);
      if (user.activeHouseholdId?.toString() === id) {
        user.activeHouseholdId = user.households[0] || undefined;
      }
      await user.save();
    }

    res.json({ success: true, message: 'Left household successfully' });
  } catch (error: any) {
    console.error('Error leaving household:', error);
    res.status(500).json({ success: false, message: 'Failed to leave household', error: error.message });
  }
};

// Remove member from household (owner only)
export const removeMember = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id, memberId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const household = await Household.findById(id);
    if (!household) {
      return res.status(404).json({ success: false, message: 'Household not found' });
    }

    // Check if current user is owner
    const currentMember = household.members.find(m => m.userId.toString() === userId);
    if (!currentMember || currentMember.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can remove members' });
    }

    // Can't remove yourself
    if (memberId === userId) {
      return res.status(400).json({ success: false, message: 'Use leave endpoint to remove yourself' });
    }

    const memberIndex = household.members.findIndex(m => m.userId.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Remove member
    household.members.splice(memberIndex, 1);
    await household.save();

    // Update removed user's household list
    const removedUser = await User.findById(memberId);
    if (removedUser) {
      removedUser.households = (removedUser.households || []).filter(h => h.toString() !== id);
      if (removedUser.activeHouseholdId?.toString() === id) {
        removedUser.activeHouseholdId = removedUser.households[0] || undefined;
      }
      await removedUser.save();
    }

    res.json({ success: true, data: household, message: 'Member removed' });
  } catch (error: any) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, message: 'Failed to remove member', error: error.message });
  }
};

// Regenerate invite code
export const regenerateInviteCode = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const household = await Household.findById(id);
    if (!household) {
      return res.status(404).json({ success: false, message: 'Household not found' });
    }

    // Check if user is owner
    const memberInfo = household.members.find(m => m.userId.toString() === userId);
    if (!memberInfo || memberInfo.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can regenerate invite codes' });
    }

    // Generate new unique code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (await Household.findOne({ inviteCode }) && attempts < 10) {
      inviteCode = generateInviteCode();
      attempts++;
    }

    household.inviteCode = inviteCode;
    household.inviteCodeExpiresAt = getInviteCodeExpiry(24);
    await household.save();

    res.json({
      success: true,
      data: {
        inviteCode: household.inviteCode,
        expiresAt: household.inviteCodeExpiresAt
      },
      message: 'Invite code regenerated'
    });
  } catch (error: any) {
    console.error('Error regenerating invite code:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate invite code', error: error.message });
  }
};

// Switch active household
export const switchHousehold = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Verify user is a member of the household
    const household = await Household.findById(id);
    if (!household) {
      return res.status(404).json({ success: false, message: 'Household not found' });
    }

    const isMember = household.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this household' });
    }

    // Update user's active household
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.activeHouseholdId = household._id as any;
    await user.save();

    res.json({
      success: true,
      data: household,
      message: `Switched to "${household.name}"`
    });
  } catch (error: any) {
    console.error('Error switching household:', error);
    res.status(500).json({ success: false, message: 'Failed to switch household', error: error.message });
  }
};

// Clear active household (go personal)
export const clearActiveHousehold = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.activeHouseholdId = undefined;
    await user.save();

    res.json({ success: true, message: 'Switched to personal mode' });
  } catch (error: any) {
    console.error('Error clearing active household:', error);
    res.status(500).json({ success: false, message: 'Failed to clear active household', error: error.message });
  }
};

// Delete household (owner only)
export const deleteHousehold = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const household = await Household.findById(id);
    if (!household) {
      return res.status(404).json({ success: false, message: 'Household not found' });
    }

    // Check if user is owner
    const memberInfo = household.members.find(m => m.userId.toString() === userId);
    if (!memberInfo || memberInfo.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can delete the household' });
    }

    // Remove household from all members
    for (const member of household.members) {
      const memberUser = await User.findById(member.userId);
      if (memberUser) {
        memberUser.households = (memberUser.households || []).filter(h => h.toString() !== id);
        if (memberUser.activeHouseholdId?.toString() === id) {
          memberUser.activeHouseholdId = memberUser.households[0] || undefined;
        }
        await memberUser.save();
      }
    }

    await Household.deleteOne({ _id: id });

    res.json({ success: true, message: 'Household deleted' });
  } catch (error: any) {
    console.error('Error deleting household:', error);
    res.status(500).json({ success: false, message: 'Failed to delete household', error: error.message });
  }
};
