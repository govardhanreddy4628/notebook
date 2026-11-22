import { Types } from "mongoose";
import { AppError } from "./AppError.js";

export const validateObjectId = (
  id: unknown,
  fieldName = "ID",
): Types.ObjectId => {
  if (
    typeof id !== "string" ||
    !/^[a-fA-F0-9]{24}$/.test(id)
  ) {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }

  return new Types.ObjectId(id);
};