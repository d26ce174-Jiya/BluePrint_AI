import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { WorkspaceModel } from '../models/Workspace.js';
import { OrganizationModel } from '../models/Organization.js';
import { env } from '../config/env.js';

// Common personal mail domains that shouldn't auto-group into one company unless specified
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'proton.me', 'protonmail.com', 'aol.com'
]);

export const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password, company } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required.',
        });
      }

      // Check if user already exists
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      // 1. Determine company / organization name
      let companyName = company ? company.trim() : '';
      if (!companyName) {
        const emailParts = email.split('@');
        const domain = emailParts[1] ? emailParts[1].toLowerCase() : '';
        if (domain && !PERSONAL_EMAIL_DOMAINS.has(domain)) {
          // Extract company from work email domain: e.g. stripe.com -> Stripe
          const domainName = domain.split('.')[0];
          companyName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
        } else {
          companyName = `${name.split(' ')[0]}'s Company`;
        }
      }

      // 2. Check if company / organization already exists
      let org = await OrganizationModel.findByName(companyName);
      let workspace = null;
      let assignedRole = 'member'; // Default to member

      if (org) {
        // Company exists! Find its workspace
        workspace = await WorkspaceModel.findByOrgId(org.id);
        if (!workspace) {
          workspace = await WorkspaceModel.create({
            name: `${companyName} Workspace`,
            orgId: org.id,
          });
        }

        // Rule: Only 1 person per company can be 'owner'
        const hasOwner = await UserModel.hasOwner(workspace.id);
        if (!hasOwner) {
          assignedRole = 'owner';
        } else {
          assignedRole = 'member'; // Company already has an owner
        }
      } else {
        // Brand new company: create organization & workspace
        org = await OrganizationModel.create({ name: companyName });
        workspace = await WorkspaceModel.create({
          name: `${companyName} Workspace`,
          orgId: org.id,
        });
        // First person registering for this company becomes the sole Owner
        assignedRole = 'owner';
      }

      // 3. Create user assigned to company workspace with enforced role
      const user = await UserModel.create({
        name,
        email,
        password,
        workspaceId: workspace.id,
        role: assignedRole,
      });

      // 4. Issue JWT Token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          workspaceId: workspace.id,
          role: user.role,
          companyName,
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: assignedRole === 'owner'
          ? `Welcome! You are the primary Owner for ${companyName}.`
          : `Welcome! You have joined ${companyName} as a Team Member.`,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: companyName,
          workspaceId: workspace.id,
          credits: user.credits !== undefined ? user.credits : 5,
          onboardingCompleted: false,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const isMatch = await UserModel.comparePassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, workspaceId: user.workspace_id, role: user.role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      // Existing accounts logging in have completed onboarding
      await UserModel.setOnboardingCompleted(user.id, true);

      res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: user.workspace_id,
          credits: user.credits !== undefined ? user.credits : 5,
          onboardingCompleted: true,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { name, company } = req.body;
      const userId = req.user.userId;

      let updatedUser = await UserModel.findById(userId);
      if (name && name.trim()) {
        updatedUser = await UserModel.updateProfile(userId, { name: name.trim() });
      }

      if (company && company.trim() && updatedUser.workspace_id) {
        await WorkspaceModel.updateName(updatedUser.workspace_id, `${company.trim()} Workspace`);
      }

      res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          company: company || req.user.companyName,
          workspaceId: updatedUser.workspace_id,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new password are required.' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isMatch = await UserModel.comparePassword(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }

      await UserModel.updatePassword(userId, newPassword);

      res.json({
        success: true,
        message: 'Password updated successfully with adaptive bcrypt encryption.',
      });
    } catch (err) {
      next(err);
    }
  },

  async completeOnboarding(req, res, next) {
    try {
      const userId = req.user?.userId;
      if (userId) {
        await UserModel.setOnboardingCompleted(userId, true);
      }
      res.json({ success: true, message: 'Onboarding completed successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req, res, next) {
    try {
      const { role } = req.body;
      const validRoles = ['owner', 'admin', 'member', 'developer', 'viewer'];
      if (!role || !validRoles.includes(String(role).toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`,
        });
      }

      const targetRole = String(role).toLowerCase();
      const userId = req.user.userId;
      const updatedUser = await UserModel.updateRole(userId, targetRole);

      // Issue refreshed JWT token containing updated role
      const token = jwt.sign(
        {
          userId: updatedUser.id,
          email: updatedUser.email,
          workspaceId: updatedUser.workspace_id,
          role: updatedUser.role,
          companyName: updatedUser.company,
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: `Role successfully updated to ${targetRole}.`,
        token,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          company: updatedUser.company,
          workspaceId: updatedUser.workspace_id,
          credits: updatedUser.credits,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async updateMemberRole(req, res, next) {
    try {
      const { memberId } = req.params;
      const { role } = req.body;
      const validRoles = ['owner', 'admin', 'member', 'developer', 'viewer'];
      if (!role || !validRoles.includes(String(role).toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`,
        });
      }

      const targetRole = String(role).toLowerCase();
      const targetUser = await UserModel.findById(memberId);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Member not found.' });
      }

      if (targetUser.workspace_id !== req.user.workspaceId) {
        return res.status(403).json({ success: false, message: 'Cannot modify users from another workspace.' });
      }

      const updatedUser = await UserModel.updateRole(memberId, targetRole);

      res.json({
        success: true,
        message: `Member ${updatedUser.name}'s role updated to ${targetRole}.`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getWorkspaceMembers(req, res, next) {
    try {
      const workspaceId = req.user.workspaceId;
      const members = await UserModel.findByWorkspace(workspaceId);
      res.json({
        success: true,
        members: members || [],
      });
    } catch (err) {
      next(err);
    }
  },
};
