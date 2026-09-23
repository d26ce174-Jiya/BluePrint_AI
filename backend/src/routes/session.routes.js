import { Router } from 'express';
import multer from 'multer';
import { sessionController } from '../controllers/sessionController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

const router = Router();

router.use(authenticateToken);

// Session routes
router.get('/', sessionController.listSessions);
router.post('/', requireRole('admin', 'developer', 'owner', 'member'), sessionController.createSession);
router.get('/:id', sessionController.getSessionDetails);
router.delete('/:id', requireRole('admin', 'owner'), sessionController.deleteSession);

// Input intake (FR-1) - requires edit permission
router.post('/:id/input', requireRole('admin', 'developer', 'owner', 'member'), upload.single('file'), sessionController.addInput);

// Discovery Q&A (FR-2) - requires edit permission
router.post('/qa/:qaId/answer', requireRole('admin', 'developer', 'owner', 'member'), sessionController.answerDiscovery);

// Conversational AI Memory (Multi-turn chat messages)
router.get('/:id/messages', sessionController.getSessionMessages);
router.post('/:id/messages', requireRole('admin', 'developer', 'owner', 'member'), sessionController.postSessionMessage);

// Reasoning generation (FR-3, FR-4, FR-5) - requires generate permission
router.post('/:id/generate', requireRole('admin', 'developer', 'owner', 'member'), sessionController.generateBlueprint);

// Single-section regeneration (FR-6.2) - requires generate permission
router.post('/:id/regenerate/:section', requireRole('admin', 'developer', 'owner', 'member'), sessionController.regenerateSection);

// Version history & Rollback (FR-6.4)
router.get('/:id/versions', sessionController.getVersions);
router.post('/:id/versions/:versionId/restore', requireRole('admin', 'developer', 'owner', 'member'), sessionController.restoreVersion);

export default router;
