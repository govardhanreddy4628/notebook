// import { Request, Response } from "express";
// import { LanguageModel } from "../models/language.model.js";

// // GET /api/languages
// export async function getLanguages(
//   _req: Request,
//   res: Response,
// ): Promise<void> {
//   try {
//     const languages = await LanguageModel.find()
//       .select("-__v")
//       .lean();

//     res.status(200).json({
//       success: true,
//       data: languages,
//     });
//   } catch (error) {
//     console.error("Get languages error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch languages",
//     });
//   }
// }

// // GET /api/languages/:id
// export async function getLanguageById(
//   req: Request,
//   res: Response,
// ): Promise<void> {
//   try {
//     const language = await LanguageModel.findOne({
//       id: req.params.id,
//     })
//       .select("-__v")
//       .lean();

//     if (!language) {
//       res.status(404).json({
//         success: false,
//         message: "Language not found",
//       });
//       return;
//     }

//     res.status(200).json({
//       success: true,
//       data: language,
//     });
//   } catch (error) {
//     console.error("Get language error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch language",
//     });
//   }
// }

// // POST /api/languages
// export async function createLanguage(
//   req: Request,
//   res: Response,
// ): Promise<void> {
//   try {
//     const { id, name, topics = [] } = req.body;

//     if (!id?.trim() || !name?.trim()) {
//       res.status(400).json({
//         success: false,
//         message: "Language id and name are required",
//       });
//       return;
//     }

//     const existing = await LanguageModel.findOne({ id });

//     if (existing) {
//       res.status(409).json({
//         success: false,
//         message: "Language already exists",
//       });
//       return;
//     }

//     const language = await LanguageModel.create({
//       id,
//       name,
//       topics,
//     });

//     res.status(201).json({
//       success: true,
//       data: language,
//     });
//   } catch (error) {
//     console.error("Create language error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to create language",
//     });
//   }
// }

// // PUT /api/languages/:id
// export async function updateLanguage(
//   req: Request,
//   res: Response,
// ): Promise<void> {
//   try {
//     const { name, topics } = req.body;

//     const updates: Record<string, unknown> = {};

//     if (name !== undefined) updates.name = name;
//     if (topics !== undefined) updates.topics = topics;

//     if (Object.keys(updates).length === 0) {
//       res.status(400).json({
//         success: false,
//         message: "Provide name or topics to update",
//       });
//       return;
//     }

//     const language = await LanguageModel.findOneAndUpdate(
//       { id: req.params.id },
//       { $set: updates },
//       { new: true, runValidators: true },
//     );

//     if (!language) {
//       res.status(404).json({
//         success: false,
//         message: "Language not found",
//       });
//       return;
//     }

//     res.status(200).json({
//       success: true,
//       data: language,
//     });
//   } catch (error) {
//     console.error("Update language error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to update language",
//     });
//   }
// }

// // DELETE /api/languages/:id
// export async function deleteLanguage(
//   req: Request,
//   res: Response,
// ): Promise<void> {
//   try {
//     const language = await LanguageModel.findOneAndDelete({
//       id: req.params.id,
//     });

//     if (!language) {
//       res.status(404).json({
//         success: false,
//         message: "Language not found",
//       });
//       return;
//     }

//     res.status(200).json({
//       success: true,
//       message: "Language deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete language error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to delete language",
//     });
//   }
// }

import type { Request, Response } from "express";

import { LanguageModel } from "../models/language.model.js";
import { ContentBlockModel } from "../models/block.model.js";
import { TopicModel } from "../models/topic.model.js";

import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectId } from "../utils/validateObjectId.js";

// CREATE LANGUAGE
export const createLanguage = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, slug, description, icon, isPublished } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
      // ||
      // typeof slug !== "string" ||
      // !slug.trim()
    ) {
      throw new AppError("Name and slug are required.", 400);
    }

    const language = await LanguageModel.create({
      name: name.trim(),
      //slug: slug.trim().toLowerCase(),
      description,
      icon,
      isPublished,
    });

    res.status(201).json({
      success: true,
      message: "Language created successfully.",
      data: language,
    });
  },
);

// GET ALL LANGUAGES
export const getLanguages = asyncHandler(
  async (req: Request, res: Response) => {
    const filter: Record<string, unknown> = {};

    // ?published=true
    if (req.query.published === "true") {
      filter.isPublished = true;
    } else if (req.query.published === "false") {
      filter.isPublished = false;
    }

    const languages = await LanguageModel.find(filter).sort({
      name: 1,
    });

    res.status(200).json({
      success: true,
      results: languages.length,
      data: languages,
    });
  },
);

// GET ONE LANGUAGE
export const getLanguage = asyncHandler(async (req: Request, res: Response) => {
  const languageId = validateObjectId(req.params.languageId, "language ID");

  const language = await LanguageModel.findById(languageId);

  if (!language) {
    throw new AppError("Language not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: language,
  });
});

// UPDATE LANGUAGE
export const updateLanguage = asyncHandler(
  async (req: Request, res: Response) => {
    const languageId = validateObjectId(req.params.languageId, "language ID");

    const updates: Record<string, unknown> = {};

    const allowedFields = [
      "name",
      "slug",
      "description",
      "icon",
      "isPublished",
    ] as const;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      throw new AppError("Name cannot be empty.", 400);
    }

    if (updates.name !== undefined) {
      updates.name = (updates.name as string).trim();
    }

    if (updates.slug !== undefined) {
      if (typeof updates.slug !== "string" || !updates.slug.trim()) {
        throw new AppError("Slug cannot be empty.", 400);
      }

      updates.slug = (updates.slug as string).trim().toLowerCase();
    }

    const language = await LanguageModel.findByIdAndUpdate(
      languageId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!language) {
      throw new AppError("Language not found.", 404);
    }

    res.status(200).json({
      success: true,
      message: "Language updated successfully.",
      data: language,
    });
  },
);

// DELETE LANGUAGE AND ITS CONTENT
export const deleteLanguage = asyncHandler(
  async (req: Request, res: Response) => {
    const languageId = validateObjectId(req.params.languageId, "language ID");

    const language = await LanguageModel.findById(languageId);

    if (!language) {
      throw new AppError("Language not found.", 404);
    }

    // Find every topic belonging to this language.
    const topics = await TopicModel.find({
      language: languageId,
    }).select("_id");

    const topicIds = topics.map((topic) => topic._id);

    // Delete all content blocks belonging to those topics.
    if (topicIds.length > 0) {
      await ContentBlockModel.deleteMany({
        topic: { $in: topicIds },
      });

      await TopicModel.deleteMany({
        language: languageId,
      });
    }

    await LanguageModel.deleteOne({ _id: languageId });

    res.status(200).json({
      success: true,
      message: "Language and its content deleted successfully.",
    });
  },
);
