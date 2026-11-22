import { Router } from "express";

import {
  createBlock,
  getTopicBlocks,
  getBlock,
  updateBlock,
  reorderBlocks,
  deleteBlock,
} from "../controllers/block.controller.js";

const router = Router();

router.post("/", createBlock);

// This route must be declared before /:blockId.
router.patch("/topic/:topicId/reorder", reorderBlocks);

router.get("/topic/:topicId", getTopicBlocks);

router.route("/:blockId")
  .get(getBlock)
  .patch(updateBlock)
  .delete(deleteBlock);

export default router;