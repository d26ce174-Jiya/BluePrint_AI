import { WorkspaceModel } from '../models/Workspace.js';
import { UserModel } from '../models/User.js';

export const workspaceController = {
  async getMyWorkspaces(req, res, next) {
    try {
      const workspaces = await WorkspaceModel.findByUserId(req.user.userId);
      res.json({ success: true, workspaces });
    } catch (err) {
      next(err);
    }
  },

  async createWorkspace(req, res, next) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Workspace name is required.' });
      }
      const workspace = await WorkspaceModel.create({ name });
      await UserModel.updateWorkspace(req.user.userId, workspace.id);
      res.status(201).json({ success: true, workspace });
    } catch (err) {
      next(err);
    }
  },

  async updateCurrentWorkspace(req, res, next) {
    try {
      const { name } = req.body;
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) {
        return res.status(404).json({ success: false, message: 'No active workspace found.' });
      }
      if (name && name.trim()) {
        await WorkspaceModel.updateName(workspaceId, name.trim());
      }
      res.json({ success: true, message: 'Workspace updated successfully.' });
    } catch (err) {
      next(err);
    }
  },
};
