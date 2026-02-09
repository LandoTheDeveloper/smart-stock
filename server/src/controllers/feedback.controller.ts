// backend/src/controllers/feedbackController.ts
import { Request, Response } from 'express';
import Feedback from '../models/Feedback';

export const submitFeedback = async (req: Request, res: Response): Promise<any> => {
  console.log('===== FEEDBACK CONTROLLER HIT =====');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const {
      type,
      title,
      description,
      email,
      userAgent,
      screenResolution,
    } = req.body;

    // Validate required fields
    if (!type || !title || !description) {
      console.log('❌ Validation failed: missing fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate type
    const validTypes = ['bug', 'ui', 'workflow', 'feature'];
    if (!validTypes.includes(type)) {
      console.log('❌ Validation failed: invalid type:', type);
      return res.status(400).json({ error: 'Invalid feedback type' });
    }

    console.log('✅ Creating feedback...');

    // Create feedback document
    const feedback = await Feedback.create({
      type,
      title,
      description,
      email: email || undefined,
      userAgent,
      screenResolution,
    });

    console.log('✅ Feedback created:', feedback._id);

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id,
    });
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    return res.status(500).json({ 
      error: 'Failed to submit feedback'
    });
  }
};

// Get all feedback (for admin)
export const getAllFeedback = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('📊 Fetching all feedback...');
    
    const { type, status, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const feedback = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Feedback.countDocuments(query);

    console.log(`✅ Found ${feedback.length} feedback items`);

    return res.json({
      success: true,
      feedback,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('❌ Get feedback error:', error);
    return res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

// Update feedback status
export const updateFeedbackStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { status, notes, priority } = req.body;
    const { id } = req.params;

    console.log(`🔄 Updating feedback ${id} status to: ${status}`);

    const validStatuses = ['new', 'in-progress', 'resolved', 'closed', 'wont-fix'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (priority) updateData.priority = priority;
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    console.log('✅ Feedback updated');

    return res.json({ success: true, feedback });
  } catch (error: any) {
    console.error('❌ Update feedback error:', error);
    return res.status(500).json({ error: 'Failed to update feedback' });
  }
};

// Delete feedback (optional)
export const deleteFeedback = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting feedback ${id}`);
    
    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    console.log('✅ Feedback deleted');

    return res.json({ success: true, message: 'Feedback deleted' });
  } catch (error: any) {
    console.error('❌ Delete feedback error:', error);
    return res.status(500).json({ error: 'Failed to delete feedback' });
  }
};