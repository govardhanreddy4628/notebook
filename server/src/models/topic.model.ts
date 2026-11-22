import mongoose, { Schema, Document, Types } from "mongoose";

export type contentBlockType =
  | "heading"
  | "text"
  | "code"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "callout";
export type NoteColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "violet"
  | "pink";

export interface ITopic extends Document {
  language: Types.ObjectId;
  parentTopic: Types.ObjectId | null;
  title: string;
  slug: string;
  description?: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ------------------------------------- TOPIC SCHEMA --------------------------------------
const topicSchema = new Schema<ITopic>(
  {
    language: {
      type: Schema.Types.ObjectId,
      ref: "Language",
      required: true,
      index: true,
    },

    parentTopic: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
      index: true,
    },

     title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    order: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Order must be an integer.",
      },
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);


// Topic slugs must be unique among siblings
// within the same language.
topicSchema.index(
  {
    language: 1,
    parentTopic: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

// Efficiently retrieve topics and their siblings in order.
topicSchema.index({
  language: 1,
  parentTopic: 1,
  order: 1,
});

export const TopicModel = mongoose.model<ITopic>(
  "Topic",
  topicSchema
);