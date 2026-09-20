import { Router } from 'express';
import { exportController } from '../controllers/exportController.js';

const router = Router();

// Allow direct browser download & authenticated export for session deliverables
router.get('/session/:id', exportController.exportBlueprint);

export default router;
