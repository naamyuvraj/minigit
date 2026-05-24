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
      const user = await User.findById(req.user.id).select("-password -__v -googleId").lean();
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

  // Get Personal Stats (Dashboard)
  async getPersonalStats(req, res) {
    try {
      const userId = req.user.id;
      
      const totalProjects = await Project.countDocuments({
        $or: [{ user_id: userId }, { collaborators: userId }]
      });

      const totalCommits = await Commit.countDocuments({ user_id: userId });
      
      const objectId = new mongoose.Types.ObjectId(userId);
      const changesAgg = await Commit.aggregate([
        { $match: { user_id: objectId } },
        { $project: { _id: 0, filesCount: { $size: { $ifNull: ["$files", []] } } } },
        { $group: { _id: null, totalChanges: { $sum: "$filesCount" } } }
      ]);
      const totalChanges = changesAgg.length > 0 ? changesAgg[0].totalChanges : 0;

      // Calculate streak based on commits grouped by day
      const commits = await Commit.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .select("createdAt");

      let currentStreak = 0;
      if (commits.length > 0) {
        let lastDate = new Date(); // Start from today
        lastDate.setHours(0, 0, 0, 0);
        
        let checkedDates = new Set();
        let streakActive = true;
        
        // Normalize commit dates to local start of day
        const commitDates = commits.map(c => {
          const d = new Date(c.createdAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        });

        // Check if there's a commit today or yesterday to even have a streak
        const todayStr = lastDate.getTime();
        const yesterdayStr = todayStr - 86400000;
        
        if (commitDates.includes(todayStr) || commitDates.includes(yesterdayStr)) {
          let testDate = commitDates.includes(todayStr) ? todayStr : yesterdayStr;
          
          while (streakActive) {
            if (commitDates.includes(testDate)) {
              currentStreak++;
              testDate -= 86400000; // go back 1 day
            } else {
              streakActive = false;
            }
          }
        }
      }

      res.status(200).json({
        stats: {
          totalProjects,
          totalCommits,
          totalChanges,
          currentStreak
        }
      });
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

  // Get friends
  async getFriends(req, res) {
    try {
      const user = await User.findById(req.user.id).populate("friends", "name email avatarUrl username");
      if (!user) return res.status(404).json({ message: "Not found" });
      res.status(200).json(user.friends || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Add friend
  async addFriend(req, res) {
    try {
      const { friendId } = req.body;
      if (!friendId) return res.status(400).json({ message: "friendId required" });
      if (friendId === req.user.id) return res.status(400).json({ message: "Cannot add yourself" });

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "Not found" });

      const friend = await User.findById(friendId);
      if (!friend) return res.status(404).json({ message: "Friend not found" });

      if (!user.friends) user.friends = [];
      const alreadyFriends = user.friends.some(id => id && id.toString() === friendId);
      if (alreadyFriends) return res.status(400).json({ message: "Already friends" });

      user.friends.push(friendId);
      user.markModified("friends");
      await user.save();
      
      // Also add to the other person's friends
      if (!friend.friends) friend.friends = [];
      const friendAlreadyHas = friend.friends.some(id => id && id.toString() === req.user.id);
      if (!friendAlreadyHas) {
        friend.friends.push(req.user.id);
        friend.markModified("friends");
        await friend.save();
      }

      const friendObj = { _id: friend._id, name: friend.name, email: friend.email, avatarUrl: friend.avatarUrl };
      res.status(200).json({ message: "Friend added successfully", friend: friendObj });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

// Export basic instance
export default new UserController();
