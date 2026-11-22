import { Router } from "express";

import {
  createTopic,
  getRootTopics,
  getAllTopicsByLanguage,
  getTopic,
  getChildTopics,
  updateTopic,
  deleteTopic,
} from "../controllers/topic.controller.js";

const router = Router();

router.post("/", createTopic);

// Get all root topics.
router.get("/language/:languageId", getRootTopics);

// Get ALL topics (root + nested) for a language.
router.get(
  "/language/:languageId/all",
  getAllTopicsByLanguage,
);

// Get direct children of a topic.
router.get("/:topicId/children", getChildTopics);

// Get, update, or delete an individual topic.
router.route("/:topicId")
  .get(getTopic)
  .patch(updateTopic)
  .delete(deleteTopic);

export default router;