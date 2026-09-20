import { Router } from 'express';
import { workspaceController } from '../controllers/workspaceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', workspaceController.getMyWorkspaces);
router.post('/', workspaceController.createWorkspace);
router.put('/current', workspaceController.updateCurrentWorkspace);

export default router;
