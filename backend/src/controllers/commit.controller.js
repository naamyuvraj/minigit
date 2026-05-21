import unzipper from "unzipper";
import DiffMatchPatch from "diff-match-patch";
import Commit from "../models/commit.model.js";
import File from "../models/file.model.js";
import Project from "../models/repo.model.js";

const dmp = new DiffMatchPatch();

class CommitController {
  // Extract zip array
  async extractZipInMemory(buffer) {
    const directory = await unzipper.Open.buffer(buffer);
    const files = [];

    for (const entry of directory.files) {
      const path = entry.path;
      if (entry.type === "File" && !path.includes("__MACOSX") && !path.includes(".DS_Store")) {
        const buffer = await entry.buffer();
        files.push({
          path,
          content: buffer.toString("utf8"), // Assuming text files for code
        });
      }
    }
    return files;
  }

  // Upload ZIP files
  async commitChangesFromZip(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Missing ZIP file" });
      }

      const { project_name, commit_message } = req.body;
      const user_id = req.user.id;

      if (!project_name) {
        return res.status(400).json({ error: "Need project name" });
      }

      // Step 1. Parse ZIP
      const extractedFiles = await this.extractZipInMemory(req.file.buffer);
      if (extractedFiles.length === 0) {
        return res.status(400).json({ error: "ZIP is empty" });
      }

      // Step 2. Create Project
      const project = await Project.create({
        name: project_name,
        user_id,
      });

      // Step 3. Create Files
      const fileObjects = await Promise.all(
        extractedFiles.map(async (f) => {
          const newFile = await File.create({
            repo_id: project._id,
            user_id,
            file_name: f.path.split("/").pop(),
            file_path: f.path,
            latest_version: 1,
            latest_content: f.content,
          });
          return {
            file_id: newFile._id,
            file_name: newFile.file_name,
            file_path: newFile.file_path,
            version: 1,
            content: f.content,
            diff: "Initial commit",
          };
        })
      );

      // Step 4. Create Commit
      const commit = await Commit.create({
        repo_id: project._id,
        user_id,
        commit_title: "Initial Commit via ZIP",
        message: commit_message || "Uploaded starting project files",
        files: fileObjects,
      });

      // Step 5. Link files to commit
      await File.updateMany(
        { repo_id: project._id },
        { $set: { commit_id: commit._id } }
      );

      res.status(201).json({
        message: "Successfully uploaded",
        project,
        commit,
      });
    } catch (err) {
      console.error("ZIP Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // Handle single file commits
  async commitFiles(req, res) {
    try {
      const { repo_id, commit_title, message, files } = req.body;
      const user_id = req.user.id;

      if (!files || !files.length) {
        return res.status(400).json({ error: "No files" });
      }

      let processedFiles = [];
      for (const f of files) {
        let existingFile = await File.findOne({
          repo_id,
          file_path: f.file_path,
        });

        let oldContent = "";
        let version = 1;

        if (existingFile) {
          oldContent = existingFile.latest_content || "";
          version = existingFile.latest_version + 1;
        } else {
          existingFile = new File({
            repo_id,
            user_id,
            file_name: f.file_name,
            file_path: f.file_path,
            commit_id: null,
          });
        }

        const patches = dmp.patch_make(oldContent, f.content);
        const diff = dmp.patch_toText(patches);

        existingFile.latest_version = version;
        existingFile.latest_content = f.content;
        await existingFile.save();

        processedFiles.push({
          file_id: existingFile._id,
          file_name: f.file_name,
          file_path: f.file_path,
          version,
          content: f.content,
          diff,
        });
      }

      const commit = new Commit({
        repo_id,
        user_id,
        commit_title,
        message,
        files: processedFiles,
      });
      await commit.save();

      // Fix file relations
      for (const pf of processedFiles) {
        await File.findByIdAndUpdate(pf.file_id, { commit_id: commit._id });
      }

      res.status(201).json({
        message: "Commit successful",
        commit,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get commit by id
  async getCommitById(req, res) {
    try {
      const commit = await Commit.findById(req.params.id);
      if (!commit) return res.status(404).json({ message: "Commit not found" });
      res.json(commit);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get all commits for a repo
  async getRepositoryCommits(req, res) {
    try {
      const commits = await Commit.find({ repo_id: req.params.repoId }).sort({ createdAt: -1 });
      res.json(commits);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get diff for a commit
  async getCommitDiff(req, res) {
    try {
      const commit = await Commit.findById(req.params.id);
      if (!commit) return res.status(404).json({ message: "Commit not found" });
      
      const diffs = commit.files.map(f => ({
        file_name: f.file_name,
        file_path: f.file_path,
        diff: f.diff
      }));
      res.json(diffs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get diff for a specific file across all commits (or latest)
  async getFileDiff(req, res) {
    try {
      const { repoId, file_path } = req.query;
      if (!repoId || !file_path) {
        return res.status(400).json({ message: "repoId and file_path are required" });
      }

      // Find the most recent commit that touched this file
      const commit = await Commit.findOne({
        repo_id: repoId,
        "files.file_path": file_path
      }).sort({ createdAt: -1 });

      if (!commit) {
        return res.status(404).json({ message: "No history found for this file" });
      }

      const fileState = commit.files.find(f => f.file_path === file_path);
      res.json({ diff: fileState.diff, content: fileState.content });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new CommitController();
