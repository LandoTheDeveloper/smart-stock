import express from 'express';
import {
  createHousehold,
  getActiveHousehold,
  getAllHouseholds,
  updateHousehold,
  joinHousehold,
  leaveHousehold,
  removeMember,
  regenerateInviteCode,
  switchHousehold,
  clearActiveHousehold,
  deleteHousehold
} from '../controllers/household.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new household
router.post('/', createHousehold);

// Get active household
router.get('/', getActiveHousehold);

// Get all households user belongs to
router.get('/all', getAllHouseholds);

// Join household via invite code
router.post('/join', joinHousehold);

// Clear active household (go personal)
router.post('/personal', clearActiveHousehold);

// Update household (owner only)
router.put('/:id', updateHousehold);

// Delete household (owner only)
router.delete('/:id', deleteHousehold);

// Leave household
router.post('/:id/leave', leaveHousehold);

// Remove member (owner only)
router.delete('/:id/members/:memberId', removeMember);

// Regenerate invite code (owner only)
router.post('/:id/regenerate-code', regenerateInviteCode);

// Switch active household
router.put('/:id/switch', switchHousehold);

export default router;
