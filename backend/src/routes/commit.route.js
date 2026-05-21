import express from "express";
import multer from "multer";
import CommitController from "../controllers/commit.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

// Create standard commit
router.post("/", CommitController.commitFiles.bind(CommitController));

// Create from Zip
router.post("/zip", upload.single("projectZip"), CommitController.commitChangesFromZip.bind(CommitController));

router.get("/diff", CommitController.getFileDiff.bind(CommitController));
router.get("/:id", CommitController.getCommitById.bind(CommitController));
router.get("/repo/:repoId", CommitController.getRepositoryCommits.bind(CommitController));
router.get("/:id/diff", CommitController.getCommitDiff.bind(CommitController));

export default router;
