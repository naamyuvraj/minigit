import File from "../models/file.model.js";
import Commit from "../models/commit.model.js";
import Project from "../models/repo.model.js";
import DiffMatchPatch from "diff-match-patch";

const dmp = new DiffMatchPatch();

class FileController {
  // Get latest file version
  async getSingleFile(req, res) {
    try {
      const { fileId } = req.params;
      const file = await File.findById(fileId);
      if (!file) return res.status(404).json({ message: "Not found" });

      res.json({
        file: {
          _id: file._id,
          file_name: file.file_name,
          file_path: file.file_path,
          latest_version: file.latest_version,
          latest_content: file.latest_content,
        },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // Save new version and commit
  async commitFileChange(req, res) {
    try {
      const { fileId } = req.params;
      const { new_content, message, project_id } = req.body;
      const user_id = req.user.id;

      const file = await File.findById(fileId);
      if (!file) return res.status(404).json({ message: "Not found" });

      const project = await Project.findById(project_id || file.repo_id);
      if (!project) return res.status(404).json({ message: "Project not found" });

      const isOwner = project.user_id.toString() === user_id;
      const isCollaborator = project.collaborators.some(c => c.toString() === user_id);
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ message: "Not authorized to commit to this project" });
      }

      const oldContent = file.latest_content;
      const oldVersion = file.latest_version;

      const patches = dmp.patch_make(oldContent, new_content);
      const diffText = dmp.patch_toText(patches);

      const commit = await Commit.create({
        repo_id: project_id,
        user_id,
        commit_title: file.file_name,
        message,
        files: [
          {
            file_id: file._id,
            file_name: file.file_name,
            file_path: file.file_path,
            version: oldVersion + 1,
            content: new_content,
            diff: diffText,
          },
        ],
      });

      file.latest_content = new_content;
      file.latest_version = oldVersion + 1;
      file.commit_id = commit._id;
      await file.save();

      return res.json({ message: "Updated", file, commit });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  // Get file by ID
  async getFileById(req, res) {
    try {
      const file = await File.findById(req.params.id);
      if (!file) return res.status(404).json({ message: "Not found" });
      return res.status(200).json({ file });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Get file history
  async getFileHistory(req, res) {
    try {
      const commits = await Commit.find({ "files.file_id": req.params.id }).sort({ createdAt: -1 });
      return res.status(200).json({ commits });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new FileController();
