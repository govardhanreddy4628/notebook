import type { Request, Response } from "express";

import { ContentBlockModel } from "../models/block.model.js";
import { TopicModel } from "../models/topic.model.js";

import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectId } from "../utils/validateObjectId.js";

const BLOCK_TYPES = [
  "heading",
  "text",
  "code",
  "image",
  "video",
  "audio",
  "table",
  "link",
  "file",
  "callout",
  "tags",
] as const;

const NOTE_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "violet",
  "pink",
] as const;

const CALLOUT_VARIANTS = ["info", "warning", "success", "danger"] as const;

const ALLOWED_FIELDS = [
  "type",
  "order",
  "level",
  "text",
  "colors",
  "code",
  "filename",
  "url",
  "alt",
  "caption",
  "language",
  "variant",
  "color",
  "table",
  "link",
  "tags",
] as const;

// Validate fields that depend on block type.
const validateBlockData = (data: Record<string, any>) => {
  if (data.type !== undefined && !BLOCK_TYPES.includes(data.type)) {
    throw new AppError("Invalid content block type.", 400);
  }

  if (
    data.order !== undefined &&
    (!Number.isInteger(data.order) || data.order < 0)
  ) {
    throw new AppError("Order must be a non-negative integer.", 400);
  }

  if (
    data.type === "heading" &&
    data.level !== undefined &&
    ![1, 2, 3, 4, 5, 6].includes(data.level)
  ) {
    throw new AppError("Heading level must be between 1 and 6.", 400);
  }

  if (data.color !== undefined && !NOTE_COLORS.includes(data.color)) {
    throw new AppError("Invalid content color.", 400);
  }

  if (data.variant !== undefined && !CALLOUT_VARIANTS.includes(data.variant)) {
    throw new AppError("Invalid callout variant.", 400);
  }

  if (data.type === "table") {
    const table = data.table;

    if (
      !table ||
      typeof table !== "object" ||
      !Array.isArray(table.columns) ||
      !Array.isArray(table.rows) ||
      table.columns.length === 0
    ) {
      throw new AppError("Invalid table data.", 400);
    }

    if (
      !table.columns.every(
        (column: unknown) =>
          typeof column === "string" && column.trim().length > 0,
      )
    ) {
      throw new AppError("Every table column needs a name.", 400);
    }

    for (const row of table.rows) {
      if (
        !Array.isArray(row) ||
        row.length !== table.columns.length ||
        !row.every((cell: unknown) => typeof cell === "string")
      ) {
        throw new AppError(
          "Every table row must contain one cell per column.",
          400,
        );
      }
    }
  }

  if (data.tags !== undefined) {
    if (
      !Array.isArray(data.tags) ||
      data.tags.some((tag) => typeof tag !== "string" || !tag.trim())
    ) {
      return "Tags must be an array of non-empty strings.";
    }

    data.tags = [...new Set(data.tags.map((tag: string) => tag.trim()))];
  }

  if (data.colors !== undefined) {
    if (!Array.isArray(data.colors)) {
      throw new AppError("colors must be an array.", 400);
    }

    for (const range of data.colors) {
      if (
        !Number.isInteger(range.start) ||
        !Number.isInteger(range.end) ||
        range.start < 0 ||
        range.end <= range.start ||
        !NOTE_COLORS.includes(range.color)
      ) {
        throw new AppError("Invalid text color range.", 400);
      }
    }
  }
};

// CREATE CONTENT BLOCK
export const createBlock = asyncHandler(async (req: Request, res: Response) => {
  const { topic, ...body } = req.body;

  if (typeof topic !== "string") {
    throw new AppError("Topic ID is required.", 400);
  }

  const topicId = validateObjectId(topic, "topic ID");

  const topicExists = await TopicModel.exists({ _id: topicId });

  if (!topicExists) {
    throw new AppError("Topic not found.", 404);
  }

  const blockData: Record<string, unknown> = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      blockData[field] = body[field];
    }
  }

  if (blockData.type === undefined) {
    throw new AppError("Content block type is required.", 400);
  }

  if (blockData.order === undefined) {
    throw new AppError("Content block order is required.", 400);
  }

  validateBlockData(blockData);

  const block = await ContentBlockModel.create({
    ...blockData,
    topic: topicId,
  });

  res.status(201).json({
    success: true,
    message: "Content block created successfully.",
    data: block,
  });
});

// GET ALL BLOCKS FOR A TOPIC, IN DISPLAY ORDER
export const getTopicBlocks = asyncHandler(
  async (req: Request, res: Response) => {
    const topicId = validateObjectId(req.params.topicId, "topic ID");

    const topicExists = await TopicModel.exists({ _id: topicId });

    if (!topicExists) {
      throw new AppError("Topic not found.", 404);
    }

    const blocks = await ContentBlockModel.find({
      topic: topicId,
    }).sort({
      order: 1,
      _id: 1,
    });

    res.status(200).json({
      success: true,
      results: blocks.length,
      data: blocks,
    });
  },
);

// GET ONE CONTENT BLOCK
export const getBlock = asyncHandler(async (req: Request, res: Response) => {
  const blockId = validateObjectId(req.params.blockId, "block ID");

  const block = await ContentBlockModel.findById(blockId);

  if (!block) {
    throw new AppError("Content block not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: block,
  });
});

// UPDATE CONTENT BLOCK
export const updateBlock = asyncHandler(async (req: Request, res: Response) => {
  const blockId = validateObjectId(req.params.blockId, "block ID");

  const block = await ContentBlockModel.findById(blockId);

  if (!block) {
    throw new AppError("Content block not found.", 404);
  }

  const updates: Record<string, unknown> = {};

  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const mergedData = {
    type: block.type,
    order: block.order,
    level: block.level,
    text: block.text,
    colors: block.colors,
    code: block.code,
    filename: block.filename,
    url: block.url,
    alt: block.alt,
    caption: block.caption,
    language: block.language,
    variant: block.variant,
    color: block.color,
    table: block.table,
    link: block.link,
    tags: block.tags,
    ...updates,
  };

  validateBlockData(mergedData);

  const updatedBlock = await ContentBlockModel.findByIdAndUpdate(
    blockId,
    { $set: updates },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    success: true,
    message: "Content block updated successfully.",
    data: updatedBlock,
  });
});

// REORDER BLOCKS
export const reorderBlocks = asyncHandler(
  async (req: Request, res: Response) => {
    const topicId = validateObjectId(req.params.topicId, "topic ID");

    const topicExists = await TopicModel.exists({ _id: topicId });

    if (!topicExists) {
      throw new AppError("Topic not found.", 404);
    }

    const { blocks } = req.body as {
      blocks?: { blockId: string; order: number }[];
    };

    if (!Array.isArray(blocks) || blocks.length === 0) {
      throw new AppError("Provide a non-empty blocks array.", 400);
    }

    const seenIds = new Set<string>();
    const seenOrders = new Set<number>();

    const operations = blocks.map((item) => {
      if (
        !item ||
        typeof item.blockId !== "string" ||
        !Number.isInteger(item.order) ||
        item.order < 0
      ) {
        throw new AppError(
          "Every block needs a valid blockId and non-negative integer order.",
          400,
        );
      }

      const blockId = validateObjectId(item.blockId, "block ID");

      const idString = blockId.toString();

      if (seenIds.has(idString)) {
        throw new AppError("Duplicate block IDs are not allowed.", 400);
      }

      if (seenOrders.has(item.order)) {
        throw new AppError("Duplicate order values are not allowed.", 400);
      }

      seenIds.add(idString);
      seenOrders.add(item.order);

      return {
        updateOne: {
          filter: {
            _id: blockId,
            topic: topicId,
          },
          update: {
            $set: { order: item.order },
          },
        },
      };
    });

    const matchingBlocks = await ContentBlockModel.countDocuments({
      _id: {
        $in: [...seenIds],
      },
      topic: topicId,
    });

    if (matchingBlocks !== blocks.length) {
      throw new AppError(
        "One or more blocks do not belong to this topic.",
        400,
      );
    }

    await ContentBlockModel.bulkWrite(operations);

    const reorderedBlocks = await ContentBlockModel.find({
      topic: topicId,
    }).sort({
      order: 1,
      _id: 1,
    });

    res.status(200).json({
      success: true,
      message: "Content blocks reordered successfully.",
      data: reorderedBlocks,
    });
  },
);

// DELETE CONTENT BLOCK
export const deleteBlock = asyncHandler(async (req: Request, res: Response) => {
  const blockId = validateObjectId(req.params.blockId, "block ID");

  const block = await ContentBlockModel.findByIdAndDelete(blockId);

  if (!block) {
    throw new AppError("Content block not found.", 404);
  }

  res.status(200).json({
    success: true,
    message: "Content block deleted successfully.",
  });
});
