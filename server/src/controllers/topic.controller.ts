import type { Request, Response } from "express";

import { TopicModel } from "../models/topic.model.js";
import { ContentBlockModel } from "../models/block.model.js";
import { LanguageModel } from "../models/language.model.js";

import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectId } from "../utils/validateObjectId.js";

// CREATE TOPIC OR SUBTOPIC
export const createTopic = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      language,
      parentTopic,
      title,
      slug,
      description,
      order,
      isPublished,
    } = req.body;

    if (
      typeof language !== "string" ||
      typeof title !== "string" ||
      !title.trim() ||
      typeof slug !== "string" ||
      !slug.trim()
    ) {
      throw new AppError(
        "Language, title, and slug are required.",
        400,
      );
    }

    const languageId = validateObjectId(
      language,
      "language ID",
    );

    const languageExists =
      await LanguageModel.exists({ _id: languageId });

    if (!languageExists) {
      throw new AppError("Language not found.", 404);
    }

    let parentId = null;

    if (parentTopic !== undefined && parentTopic !== null) {
      if (typeof parentTopic !== "string") {
        throw new AppError(
          "parentTopic must be a valid ID or null.",
          400,
        );
      }

      parentId = validateObjectId(
        parentTopic,
        "parent topic ID",
      );

      const parent = await TopicModel.findById(parentId);

      if (!parent) {
        throw new AppError("Parent topic not found.", 404);
      }

      if (!parent.language.equals(languageId)) {
        throw new AppError(
          "Parent topic must belong to the same language.",
          400,
        );
      }
    }

    const topic = await TopicModel.create({
      language: languageId,
      parentTopic: parentId,
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      description,
      order,
      isPublished,
    });

    res.status(201).json({
      success: true,
      message: "Topic created successfully.",
      data: topic,
    });
  },
);

// GET ROOT TOPICS FOR A LANGUAGE
export const getRootTopics = asyncHandler(
  async (req: Request, res: Response) => {
    const languageId = validateObjectId(
      req.params.languageId,
      "language ID",
    );

    const languageExists =
      await LanguageModel.exists({ _id: languageId });

    if (!languageExists) {
      throw new AppError("Language not found.", 404);
    }

    const topics = await TopicModel.find({
      language: languageId,
      parentTopic: null,
    }).sort({ order: 1, title: 1 });

    res.status(200).json({
      success: true,
      results: topics.length,
      data: topics,
    });
  },
);

// GET ONE TOPIC
export const getTopic = asyncHandler(
  async (req: Request, res: Response) => {
    const topicId = validateObjectId(
      req.params.topicId,
      "topic ID",
    );

    const topic = await TopicModel.findById(topicId);

    if (!topic) {
      throw new AppError("Topic not found.", 404);
    }

    res.status(200).json({
      success: true,
      data: topic,
    });
  },
);

// GET DIRECT CHILDREN OF A TOPIC
export const getChildTopics = asyncHandler(
  async (req: Request, res: Response) => {
    const topicId = validateObjectId(
      req.params.topicId,
      "topic ID",
    );

    const parent = await TopicModel.findById(topicId);

    if (!parent) {
      throw new AppError("Topic not found.", 404);
    }

    const children = await TopicModel.find({
      language: parent.language,
      parentTopic: parent._id,
    }).sort({ order: 1, title: 1 });

    res.status(200).json({
      success: true,
      results: children.length,
      data: children,
    });
  },
);

// UPDATE TOPIC
export const updateTopic = asyncHandler(
  async (req: Request, res: Response) => {
    const topicId = validateObjectId(
      req.params.topicId,
      "topic ID",
    );

    const topic = await TopicModel.findById(topicId);

    if (!topic) {
      throw new AppError("Topic not found.", 404);
    }

    const updates: Record<string, unknown> = {};

    const allowedFields = [
      "title",
      "slug",
      "description",
      "order",
      "isPublished",
    ] as const;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.title !== undefined) {
      if (
        typeof updates.title !== "string" ||
        !updates.title.trim()
      ) {
        throw new AppError("Title cannot be empty.", 400);
      }

      updates.title = (updates.title as string).trim();
    }

    if (updates.slug !== undefined) {
      if (
        typeof updates.slug !== "string" ||
        !updates.slug.trim()
      ) {
        throw new AppError("Slug cannot be empty.", 400);
      }

      updates.slug = (updates.slug as string)
        .trim()
        .toLowerCase();
    }

    // Optionally move a topic to another parent.
    if (req.body.parentTopic !== undefined) {
      const parentTopic = req.body.parentTopic;

      if (parentTopic === null) {
        // Move topic to the root level.
        updates.parentTopic = null;
      } else {
        if (typeof parentTopic !== "string") {
          throw new AppError(
            "parentTopic must be a valid ID or null.",
            400,
          );
        }

        const newParentId = validateObjectId(
          parentTopic,
          "parent topic ID",
        );

        if (newParentId.equals(topic._id)) {
          throw new AppError(
            "A topic cannot be its own parent.",
            400,
          );
        }

        const newParent =
          await TopicModel.findById(newParentId);

        if (!newParent) {
          throw new AppError(
            "New parent topic not found.",
            404,
          );
        }

        if (!newParent.language.equals(topic.language)) {
          throw new AppError(
            "Parent topic must belong to the same language.",
            400,
          );
        }

        // Prevent moving a topic beneath one of its descendants.
        let currentParentId = newParent.parentTopic;
        const visited = new Set<string>();

        while (currentParentId !== null) {
          const currentId = currentParentId.toString();

          if (currentId === topic._id.toString()) {
            throw new AppError(
              "A topic cannot be moved beneath its own descendant.",
              400,
            );
          }

          if (visited.has(currentId)) {
            throw new AppError(
              "A circular topic hierarchy already exists.",
              409,
            );
          }

          visited.add(currentId);

          const ancestor = await TopicModel.findById(
            currentParentId,
          ).select("parentTopic");

          if (!ancestor) {
            break;
          }

          currentParentId = ancestor.parentTopic;
        }

        updates.parentTopic = newParentId;
      }
    }

    const updatedTopic = await TopicModel.findByIdAndUpdate(
      topicId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Topic updated successfully.",
      data: updatedTopic,
    });
  },
);

// DELETE TOPIC, ALL DESCENDANTS, AND THEIR CONTENT BLOCKS
export const deleteTopic = asyncHandler(
  async (req: Request, res: Response) => {
    const topicId = validateObjectId(
      req.params.topicId,
      "topic ID",
    );

    const topic = await TopicModel.findById(topicId);

    if (!topic) {
      throw new AppError("Topic not found.", 404);
    }

    // Traverse the hierarchy and collect every descendant.
    const topicIds = [topic._id];
    let frontier = [topic._id];

    while (frontier.length > 0) {
      const children = await TopicModel.find({
        language: topic.language,
        parentTopic: { $in: frontier },
      }).select("_id");

      frontier = children.map((child) => child._id);

      topicIds.push(...frontier);
    }

    // Delete blocks belonging to every topic in the subtree.
    await ContentBlockModel.deleteMany({
      topic: { $in: topicIds },
    });

    // Delete the topic and all descendants.
    await TopicModel.deleteMany({
      _id: { $in: topicIds },
    });

    res.status(200).json({
      success: true,
      message: "Topic and its descendants deleted successfully.",
      deletedTopics: topicIds.length,
    });
  },
);


// GET ALL TOPICS FOR A LANGUAGE (ROOT + NESTED)
export const getAllTopicsByLanguage = asyncHandler(
  async (req: Request, res: Response) => {
    const languageId = validateObjectId(
      req.params.languageId,
      "language ID",
    );

    const languageExists = await LanguageModel.exists({
      _id: languageId,
    });

    if (!languageExists) {
      throw new AppError("Language not found.", 404);
    }

    const topics = await TopicModel.find({
      language: languageId,
    }).sort({ order: 1, title: 1 });

    res.status(200).json({
      success: true,
      results: topics.length,
      data: topics,
    });
  },
);