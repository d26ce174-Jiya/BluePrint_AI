import { Router } from 'express';
import multer from 'multer';
import { sessionController } from '../controllers/sessionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

const router = Router();

router.use(authenticateToken);

// Session routes
router.get('/', sessionController.listSessions);
router.post('/', sessionController.createSession);
router.get('/:id', sessionController.getSessionDetails);
router.delete('/:id', sessionController.deleteSession);

// Input intake (FR-1)
router.post('/:id/input', upload.single('file'), sessionController.addInput);

// Discovery Q&A (FR-2)
router.post('/qa/:qaId/answer', sessionController.answerDiscovery);

// Conversational AI Memory (Multi-turn chat messages)
router.get('/:id/messages', sessionController.getSessionMessages);
router.post('/:id/messages', sessionController.postSessionMessage);

// Reasoning generation (FR-3, FR-4, FR-5)
router.post('/:id/generate', sessionController.generateBlueprint);

// Single-section regeneration (FR-6.2)
router.post('/:id/regenerate/:section', sessionController.regenerateSection);

// Version history & Rollback (FR-6.4)
router.get('/:id/versions', sessionController.getVersions);
router.post('/:id/versions/:versionId/restore', sessionController.restoreVersion);

export default router;
