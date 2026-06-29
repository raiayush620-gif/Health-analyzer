import express from 'express';
import {
  getAllUsers,
  deleteUser,
  updateUserRole,
  getGlobalStats,
} from '../controllers/recordController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect & admin middlewares to all admin routes
router.use(protect, admin);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);
router.get('/stats', getGlobalStats);

export default router;
