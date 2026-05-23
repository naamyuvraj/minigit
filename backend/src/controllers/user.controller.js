import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Commit from "../models/commit.model.js";
import Project from "../models/repo.model.js";

// User controller class
class UserController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select("-password -_id -__v -googleId").lean();
      if (!user) return res.status(404).json({ message: "Not found" });

      const totalCommits = await Commit.countDocuments({ user_id: req.user.id });
      
      const objectId = new mongoose.Types.ObjectId(req.user.id);
      
      const changesAgg = await Commit.aggregate([
        { $match: { user_id: objectId } },
        { $project: { _id: 0, filesCount: { $size: { $ifNull: ["$files", []] } } } },
        { $group: { _id: null, totalChanges: { $sum: "$filesCount" } } }
      ]);
      const totalChanges = changesAgg.length > 0 ? changesAgg[0].totalChanges : 0;

      res.status(200).json({ user: { ...user, totalCommits, totalChanges } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get user recent activity
  async getActivity(req, res) {
    try {
      // Find latest 20 commits by the user or on projects the user owns/collaborates on
      const userProjects = await Project.find({
        $or: [
          { user_id: req.user.id },
          { collaborators: req.user.id }
        ]
      }).select('_id');
      const projectIds = userProjects.map(p => p._id);

      const commits = await Commit.find({
        $or: [
          { user_id: req.user.id },
          { repo_id: { $in: projectIds } }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate("repo_id", "name")
        .populate("user_id", "name avatarUrl");
      
      const activity = commits.map(c => {
        return {
          id: c._id,
          action: "Committed changes",
          actor: c.user_id?.name || "Unknown User",
          target: c.repo_id?.name || "Unknown Project",
          timestamp: c.createdAt,
          type: "update",
          avatar: c.user_id?.avatarUrl || "",
          projectId: c.repo_id?._id || "",
          message: c.message
        };
      });

      res.status(200).json({ activity });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Search users by username
  async searchUsers(req, res) {
    try {
      const { q } = req.query;
      if (!q) return res.status(200).json({ users: [] });
      
      const users = await User.find({
        $or: [
          { username: { $regex: q, $options: "i" } },
          { name: { $regex: q, $options: "i" } }
        ]
      })
      .select("_id name username avatarUrl")
      .limit(10)
      .lean();

      res.status(200).json({ users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update bio or avatar
  async updateBioAvatar(req, res) {
    try {
      const { bio, avatarUrl, name } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "Not found" });

      user.name = name || user.name;
      user.bio = bio !== undefined ? bio : user.bio;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      
      await user.save();
      res.status(200).json({ user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password too short" });
      }

      const user = await User.findById(req.user.id).select("+password");
      if (!user) return res.status(404).json({ message: "Not found" });

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      res.status(200).json({ message: "Updated" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

// Export basic instance
export default new UserController();
