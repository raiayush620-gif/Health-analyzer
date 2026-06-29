import express from 'express';
import {
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
  getUserStats,
} from '../controllers/recordController.js';
import { getAIInsight } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// CRUD routes
router.route('/')
  .post(protect, createRecord)
  .get(protect, getRecords);

router.route('/:id')
  .put(protect, updateRecord)
  .delete(protect, deleteRecord);

// Statistics and AI Insights
router.get('/data/stats', protect, getUserStats);
router.get('/data/ai-insight', protect, getAIInsight);

export default router;
