import type {
  Request,
  Response,
  NextFunction,
} from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: "Invalid ID or field value.",
    });
    return;
  }

  if (
    err instanceof mongoose.mongo.MongoServerError &&
    err.code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "A record with these unique fields already exists.",
    });
    return;
  }

  const statusCode =
    err instanceof AppError ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error."
        : err.message,
  });
};