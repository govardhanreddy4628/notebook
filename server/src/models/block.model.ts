import mongoose, { Schema, Types } from "mongoose";

export type contentBlockType =
  | "heading"
  | "text"
  | "code"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "callout"
  | "table"
  | "link";
export type NoteColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "violet"
  | "pink";
export type CalloutVariant = "info" | "warning" | "success" | "danger";

export interface ITextColorRange {
  start: number;
  end: number;
  color: NoteColor;
}

export interface ITableData {
  columns: string[];
  rows: string[][];
}

export type WhiteboardBackground = "plain" | "grid" | "lined";

export interface IWhiteboardData {
  background: WhiteboardBackground;
}

export interface IContentBlock {
  type: contentBlockType;
  topic: Types.ObjectId;
  order: number;
  // For Heading content
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  //level?: number;
  // Text and heading content
  text?: string;
  colors?: ITextColorRange[];
  link?: string;
  tags?: string[];
  // content: string;
  // Code content
  code?: string;
  language?: string;
  filename?: string;

  table?: ITableData;

  // Image and video content
  url?: string;
  alt?: string;
  caption?: string;
  fileId?: string;

  // Callout
  variant?: CalloutVariant;

  // Optional display color
  color?: NoteColor;

  // Whiteboard
  whiteboard?: IWhiteboardData;

  createdAt?: Date;
  updatedAt?: Date;
}

// ------------------ CONSTANTS -----------------
const NOTE_COLORS: NoteColor[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "violet",
  "pink",
];

// ------------------------------------- TEXT COLOR RANGE SCHEMA -------------------------------------
const textColorRangeSchema = new Schema<ITextColorRange>(
  {
    start: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Start must be an integer.",
      },
    },

    end: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: function (this: any, value: number): boolean {
          return Number.isInteger(value) && value > this.start;
        },
        message: "End must be an integer greater than start.",
      },
    },

    color: {
      type: String,
      enum: NOTE_COLORS,
      required: true,
    },
  },
  {
    _id: false,
    id: false,
  },
);

// ------------------------------------- TABLE SCHEMA --------------------------------------

const tableSchema = new Schema<ITableData>(
  {
    columns: {
      type: [String],
      required: true,
      validate: {
        validator: (columns: string[]) =>
          columns.length > 0 &&
          columns.every((column) => column.trim().length > 0),
        message: "A table must have at least one non-empty column.",
      },
    },

    rows: {
      type: [[String]],
      default: [],
    },
  },
  {
    _id: false,
    id: false,
  },
);

// ------------------------------------- BLOCK SCHEMA --------------------------------------
const contentBlockSchema = new Schema<IContentBlock>(
  {
    type: {
      type: String,
      enum: [
        "heading",
        "text",
        "code",
        "image",
        "video",
        "audio",
        "file",
        "callout",
        "table",
        "link",
        "tags",
        "whiteboard"
      ],
      required: true,
    },

    topic: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },

    order: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Order must be an integer.",
      },
    },

    // Heading level: H1 to H6.
    level: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6],
    },

    text: {
      type: String,
      default: undefined,
    },

    colors: {
      type: [textColorRangeSchema],
      default: [],
    },

    table: {
      type: tableSchema,
      default: undefined,
    },

    link: {
      type: String,
    },

    tags: {
      type: [String],
      default: [],
    },

    code: {
      type: String,
    },

    filename: {
      type: String,
      trim: true,
    },

    url: {
      type: String,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
    },

    caption: {
      type: String,
      trim: true,
    },

    // Programming language for code blocks.
    // Examples: javascript, python, java, html.
    language: {
      type: String,
      trim: true,
    },

    variant: {
      type: String,
      enum: ["info", "warning", "success", "danger"],
    },

    // Color key selected in the frontend.
    color: {
      type: String,
      enum: NOTE_COLORS,
    },
    fileId: {
      type: String,
      trim: true,
    },

    whiteboard: {
      background: {
        type: String,
        enum: ["plain", "grid", "lined"],
        default: "plain",
      },
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export const ContentBlockModel = mongoose.model<IContentBlock>(
  "ContentBlock",
  contentBlockSchema,
);
