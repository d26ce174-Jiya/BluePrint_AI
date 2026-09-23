import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/password', authenticateToken, authController.changePassword);
router.put('/onboarding', authenticateToken, authController.completeOnboarding);

// RBAC Role Management Endpoints
router.put('/role', authenticateToken, authController.updateRole);
router.get('/members', authenticateToken, authController.getWorkspaceMembers);
router.put('/users/:memberId/role', authenticateToken, requireRole('admin', 'owner'), authController.updateMemberRole);

export default router;
