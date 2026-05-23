import User from "../models/user.model.js";
import Project from "../models/repo.model.js";
import Commit from "../models/commit.model.js";
import File from "../models/file.model.js";

class AdminController {
  async getDashboardStats(req, res) {
    try {
      // Basic counts
      const totalUsers = await User.countDocuments();
      const totalProjects = await Project.countDocuments();
      const totalCommits = await Commit.countDocuments();
      const totalFiles = await File.countDocuments();

      // Recent users
      const recentUsers = await User.find()
        .select("-password -googleId")
        .sort({ createdAt: -1 })
        .limit(5);

      // Recent projects
      const recentProjects = await Project.find()
        .populate("user_id", "name avatarUrl username")
        .sort({ createdAt: -1 })
        .limit(5);

      res.status(200).json({
        stats: {
          totalUsers,
          totalProjects,
          totalCommits,
          totalFiles,
        },
        recentUsers,
        recentProjects,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new AdminController();
