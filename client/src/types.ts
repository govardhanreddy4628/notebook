//export type Block = { id: string; type: BlockType; content: string; lang?: string | undefined; level?: number | undefined; color?: string | undefined; colors?: TextColorRange[] };
//export type Topic = { id: string; title: string; blocks: Block[]; children: Topic[] };

export type Language = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Topic = {
  id: string;
  language: string;
  parentTopic: string | null;
  title: string;
  slug: string;
  description?: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface TableData {
  columns: string[];
  rows: string[][];
}

export type WhiteboardBackground = "plain" | "grid" | "lined";

export interface WhiteboardSettings {
  background: WhiteboardBackground;
}

export type ContentBlockType =
  | "heading"
  | "text"
  | "code"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "callout"
  | "table"
  | "link"
  | "tags"
  | "whiteboard";

export type BlockType = ContentBlockType;

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

export type TextColorRange = {
  start: number;
  end: number;
  color: NoteColor;
};

export type Block = {
  id: string;
  type: ContentBlockType;
  topic: string;
  order: number;

  // Heading
  level?: 1 | 2 | 3 | 4 | 5 | 6;

  // Text and heading
  text?: string;
  colors?: TextColorRange[];

  // Code
  code?: string;
  language?: string;
  filename?: string;

  // Image, video, audio, and file
  url?: string;
  alt?: string;
  caption?: string;

  table?: TableData;
  link?: string;
  tags?: string[];

  // Callout
  variant?: CalloutVariant;

  // Display color
  color?: NoteColor;

  fileId?: string;
  whiteboard?: WhiteboardSettings;

  createdAt?: string;
  updatedAt?: string;
};

export type ContentBlock = Block;
