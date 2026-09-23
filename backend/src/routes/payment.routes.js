import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// All payment operations require valid authentication
router.use(authenticateToken);

// 1. Get current coin balance
router.get('/balance', paymentController.getBalance);

// 2. Create payment order
router.post('/create-order', paymentController.createOrder);

// 3. Verify payment signature and credit coins
router.post('/verify', paymentController.verifyPayment);

// 4. Report failed / cancelled payment
router.post('/failed', paymentController.reportFailure);

// 5. Deduct 1 coin for blueprint generation
router.post('/deduct', paymentController.deductCoin);

export default router;
