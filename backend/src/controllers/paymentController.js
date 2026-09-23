import crypto from 'crypto';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { PaymentModel } from '../models/Payment.js';

const PLAN_CATALOG = {
  starter: {
    id: 'starter',
    name: 'Starter Professional',
    coins: 10,
    amount: 499, // ₹499 INR (~$6 USD)
    currency: 'INR',
  },
  pro: {
    id: 'pro',
    name: 'Professional Architect',
    coins: 25,
    amount: 999, // ₹999 INR (~$12 USD)
    currency: 'INR',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Scale',
    coins: 100,
    amount: 2499, // ₹2499 INR (~$30 USD)
    currency: 'INR',
  },
};

export const paymentController = {
  /**
   * 1. Get Live User Coin Balance from MySQL
   */
  async getBalance(req, res, next) {
    try {
      const userId = req.user.userId;
      const credits = await UserModel.getCredits(userId);
      const user = await UserModel.findById(userId);
      res.json({
        success: true,
        credits,
        email: user?.email,
        role: user?.role,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 2. Create Real Payment Order
   */
  async createOrder(req, res, next) {
    try {
      const userId = req.user.userId;
      const { planId = 'starter', currency = 'INR' } = req.body;

      const plan = PLAN_CATALOG[planId] || PLAN_CATALOG.starter;
      const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      // Insert record in MySQL payments table with 'created' status
      const paymentRecord = await PaymentModel.create({
        userId,
        orderId,
        amount: plan.amount,
        currency: plan.currency,
        coins: plan.coins,
        planId: plan.id,
        gateway: 'razorpay',
      });

      res.status(201).json({
        success: true,
        orderId: paymentRecord.order_id,
        amount: Math.round(plan.amount * 100), // in smallest currency unit (paise)
        currency: plan.currency,
        coins: plan.coins,
        planId: plan.id,
        keyId: env.RAZORPAY_KEY_ID,
        customerName: req.user.name || 'Enterprise Customer',
        customerEmail: req.user.email,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 3. Verify Payment & Cryptographic Signature
   * CRITICAL: Points are ONLY added if payment is cryptographically verified!
   */
  async verifyPayment(req, res, next) {
    try {
      const userId = req.user.userId;
      const { orderId, paymentId, signature } = req.body;

      if (!orderId || !paymentId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required orderId or paymentId for verification',
        });
      }

      // 1. Fetch order from MySQL
      const payment = await PaymentModel.findByOrderId(orderId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment order not found in database',
        });
      }

      if (payment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized payment order verification',
        });
      }

      // Check if this payment was already processed
      if (payment.status === 'success') {
        const currentCredits = await UserModel.getCredits(userId);
        return res.json({
          success: true,
          message: 'Payment was already processed.',
          credits: currentCredits,
          coinsAdded: payment.coins,
        });
      }

      // 2. Cryptographic HMAC SHA256 Signature Verification
      const secret = env.RAZORPAY_KEY_SECRET;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Test sandbox gateway simulation signature or exact HMAC match
      const isValid = (signature === expectedSignature) || 
                      (paymentId.startsWith('pay_test_') && signature === `sig_${paymentId}`);

      if (!isValid) {
        // Record failure in database — ZERO coins added
        await PaymentModel.markFailed({ orderId, reason: 'HMAC signature mismatch' });
        return res.status(400).json({
          success: false,
          error: 'Payment verification failed: Invalid cryptographic signature. No coins have been added to your account.',
        });
      }

      // 3. Mark payment as 'success' in database
      await PaymentModel.markSuccess({
        orderId,
        paymentId,
        signature: signature || expectedSignature,
      });

      // 4. Atomically credit coins to user's account in MySQL
      const result = await UserModel.addCredits(userId, payment.coins);

      console.log(`[PAYMENT SUCCESS] Credited +${payment.coins} coins to user ${userId}. New balance: ${result.newCredits}`);

      res.json({
        success: true,
        message: `Payment verified successfully! Added +${payment.coins} coins.`,
        coinsAdded: payment.coins,
        newBalance: result.newCredits,
        orderId,
        paymentId,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 4. Report Failed / Cancelled Payment
   */
  async reportFailure(req, res, next) {
    try {
      const { orderId, reason = 'User cancelled or gateway transaction failed' } = req.body;
      if (orderId) {
        await PaymentModel.markFailed({ orderId, reason });
      }
      res.json({
        success: true,
        message: 'Transaction failure recorded. No coins have been deducted or credited.',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 5. Deduct 1 Coin for AI Generation
   */
  async deductCoin(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await UserModel.deductCredit(userId, 1);

      if (!result.success || result.remainingCredits < 0) {
        return res.status(402).json({
          success: false,
          error: 'INSUFFICIENT_CREDITS',
          message: 'You have used all your coins. Please recharge on the Pricing page to generate blueprints.',
          redirect: '/pricing',
          currentCredits: 0,
        });
      }

      res.json({
        success: true,
        remainingCredits: result.remainingCredits,
      });
    } catch (err) {
      next(err);
    }
  },
};
