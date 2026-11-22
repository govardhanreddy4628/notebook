import type { Request, Response } from "express";
import { imagekit } from "../config/imagekit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const getImageKitAuth = asyncHandler(
  async (_req: Request, res: Response) => {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;

    if (!publicKey) {
      throw new AppError(
        "ImageKit public key is not configured.",
        500,
      );
    }

    const authenticationParameters =
      imagekit.helper.getAuthenticationParameters();

    res.status(200).json({
      success: true,
      data: {
        ...authenticationParameters,
        publicKey,
      },
    });
  },
);