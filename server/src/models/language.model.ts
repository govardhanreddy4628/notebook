import mongoose, { Schema, Document } from "mongoose";

export interface ILanguage extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}


// ----------- LANGUAGE SCHEMA -----------------
const languageSchema = new Schema<ILanguage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

     slug: {
      type: String,
      //required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    icon: {
      type: String,
      trim: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


export const LanguageModel = mongoose.model<ILanguage>(
  "Language",
  languageSchema,
);
