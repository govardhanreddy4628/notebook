import { useCallback, useEffect, useState, useRef } from "react";
import {
  Trash2, Pencil, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Type, Code2, Save,
  Image as ImageIcon, Video, Music, FileText, AlertCircle, Table2, Link2, Tags,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import type {
  Topic,
  ContentBlock,
  ContentBlockType,
  CalloutVariant,
} from "@/types";
import { BLOCKS_API } from "@/lib/api";
import {
  applyTextColor,
  textColorSegments,
  updateTextColors,
} from "@/lib/text-colors";

import type { NoteColor, TextColorRange } from "@/types";
import { CodeBlock } from "./CodeBlock";

import { upload } from "@imagekit/javascript";
import { IMAGEKIT_AUTH_API } from "@/lib/api";

import { Brush } from "lucide-react";
import { WhiteboardEditor } from "@/features/whiteboard/WhiteboardEditor";


// ------------- API TYPES --------------------
type ApiReference = string | { _id?: string; id?: string };

type ApiContentBlock = Omit<ContentBlock, "id" | "topic"> & {
  _id?: string;
  id?: string;
  topic: ApiReference;
};

// ------------- API HELPERS -----------------
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}


async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);

    const message =
      isRecord(body) && typeof body["message"] === "string"
        ? body["message"]
        : isRecord(body) && typeof body["error"] === "string"
          ? body["error"]
          : `Request failed (${response.status})`;

    throw new Error(message);
  }

  if (response.status === 204) { return undefined as T }
  return (await response.json()) as T;
}

function unwrapData(response: unknown): unknown {
  if (!isRecord(response)) {
    return response;
  }

  const data = response["data"];

  if (isRecord(data) && "block" in data) {
    return data["block"];
  }

  if (isRecord(data) && ("_id" in data || "id" in data)) {
    return data;
  }

  if ("block" in response) {
    return response["block"];
  }

  return data ?? response;
}

function extractBlocks(response: unknown): ApiContentBlock[] {
  if (Array.isArray(response)) {
    return response as ApiContentBlock[];
  }

  if (!isRecord(response)) {
    throw new Error("Invalid content blocks API response.");
  }

  const data = response["data"];

  if (Array.isArray(data)) {
    return data as ApiContentBlock[];
  }

  const blocks = response["blocks"];

  if (Array.isArray(blocks)) {
    return blocks as ApiContentBlock[];
  }

  if (isRecord(data) && Array.isArray(data["blocks"])) {
    return data["blocks"] as ApiContentBlock[];
  }

  throw new Error(
    "Invalid content blocks response. Expected an array of blocks.",
  );
}

function getReferenceId(reference: ApiReference): string {
  if (typeof reference === "string") {
    return reference;
  }

  return reference._id ?? reference.id ?? "";
}

function normalizeBlock(block: ApiContentBlock): ContentBlock {
  return {
    ...block,
    id: block._id ?? block.id ?? "",
    topic: getReferenceId(block.topic),
  };
}

// ---------------- COMPONENT ---------------------------
type TopicViewProps = {
  topic: Topic;
  language: string;
};


// --------------  NOTE COLORS -----------------------
const NOTE_COLORS: { key: NoteColor | ""; label: string; value?: string; }[] = [
  { key: "", label: "Default" },
  { key: "red", label: "Red", value: "var(--note-red)" },
  { key: "orange", label: "Orange", value: "var(--note-orange)" },
  { key: "yellow", label: "Yellow", value: "var(--note-yellow)" },
  { key: "green", label: "Green", value: "var(--note-green)" },
  { key: "cyan", label: "Cyan", value: "var(--note-cyan)" },
  { key: "blue", label: "Blue", value: "var(--note-blue)" },
  { key: "violet", label: "Violet", value: "var(--note-violet)" },
  { key: "pink", label: "Pink", value: "var(--note-pink)" },
];

function colorValue(color?: NoteColor): string | undefined {
  return NOTE_COLORS.find((item) => item.key === color)?.value;
}

function ColoredText({ content, colors }: {
  content: string;
  colors: TextColorRange[];
}) {
  return (
    <>
      {textColorSegments(content, colors).map((segment, index) => (
        <span
          key={index}
          style={{ color: colorValue(segment.color) }}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

type ImageKitAuth = {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
};

type ImageKitAuthResponse = {
  success: boolean;
  data: ImageKitAuth;
};

export function TopicView({ topic, language }: TopicViewProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // ---------------- LOAD BLOCKS FOR THE SELECTED TOPIC -------------------------
  const loadBlocks = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest<unknown>(
          `${BLOCKS_API}/topic/${encodeURIComponent(topic.id)}`,
          signal ? { signal } : {},
        );

        if (signal?.aborted) return;

        const items = extractBlocks(response)
          .map(normalizeBlock)
          .filter((block) => block.id.length > 0)
          .sort((a, b) => a.order - b.order);

        setBlocks(items);
      } catch (err: unknown) {
        if (signal?.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Could not load content blocks.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [topic.id],
  );

  useEffect(() => {
    const controller = new AbortController();

    setBlocks([]);
    setEditing(null);

    void loadBlocks(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadBlocks]);

  // Scroll to the block whenever its editor opens.
  useEffect(() => {
    if (!editing) return;

    const frame = requestAnimationFrame(() => {
      document
        .getElementById(`block-${editing}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    });

    return () => cancelAnimationFrame(frame);
  }, [editing]);

  // --------------- CREATE BLOCK ----------------------------
  const addBlock = (type: ContentBlockType, level?: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (saving) return;

    const draftBlock: ContentBlock = {
      id: `draft-${crypto.randomUUID()}`,
      topic: topic.id,
      type,
      order: blocks.length,
      ...(type === "heading" && {
        level: level ?? 2,
        text: "",
      }),
      ...(type === "text" && {
        text: "",
      }),
      ...(type === "link" && {
        text: "",
        link: "",
      }),
      ...(type === "table" && {
        table: {
          columns: ["Column 1", "Column 2"],
          rows: [["", ""]],
        },
      }),
      ...(type === "tags" && {
        tags: [],
      }),
      ...(type === "code" && {
        code: "",
        language: language.toLowerCase(),
      }),
      ...(type === "whiteboard" && {
        whiteboard: {
          background: "plain",
        },
      }),
    };

    // Add the temporary block to React state.
    // No API request is made here.
    setBlocks((current) => [...current, draftBlock]);

    // Immediately open its editor.
    setEditing(draftBlock.id);
  };

  // --------------------- UPDATE BLOCK -------------------------

  const saveBlock = async (updatedBlock: ContentBlock) => {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      // Prepare the backend payload.
      const payload: Record<string, unknown> = {
        type: updatedBlock.type,
        topic: topic.id,
        order: updatedBlock.order,
      };

      if (updatedBlock.level !== undefined) {
        payload["level"] = updatedBlock.level;
      }

      if (updatedBlock.text !== undefined) {
        payload["text"] = updatedBlock.text;
      }

      if (updatedBlock.colors !== undefined) {
        payload["colors"] = updatedBlock.colors;
      }

      if (updatedBlock.code !== undefined) {
        payload["code"] = updatedBlock.code;
      }

      if (updatedBlock.language !== undefined) {
        payload["language"] = updatedBlock.language;
      }

      if (updatedBlock.filename !== undefined) {
        payload["filename"] = updatedBlock.filename;
      }

      if (updatedBlock.url !== undefined) {
        payload["url"] = updatedBlock.url;
      }

      if (updatedBlock.alt !== undefined) {
        payload["alt"] = updatedBlock.alt;
      }

      if (updatedBlock.caption !== undefined) {
        payload["caption"] = updatedBlock.caption;
      }

      if (updatedBlock.variant !== undefined) {
        payload["variant"] = updatedBlock.variant;
      }

      if (updatedBlock.color !== undefined) {
        payload["color"] = updatedBlock.color;
      }

      if (updatedBlock.table !== undefined) {
        payload["table"] = updatedBlock.table;
      }

      if (updatedBlock.link !== undefined) {
        payload["link"] = updatedBlock.link;
      }

      if (updatedBlock.tags !== undefined) {
        payload["tags"] = updatedBlock.tags;
      }

      if (updatedBlock.fileId !== undefined) {
        payload["fileId"] = updatedBlock.fileId;
      }

      if (updatedBlock.whiteboard !== undefined) {
        payload["whiteboard"] = updatedBlock.whiteboard;
      }

      // Check whether this is a newly created draft.
      const isNewBlock = updatedBlock.id.startsWith("draft-");

      if (isNewBlock) {
        // CREATE: Send POST request only when Save is clicked.
        const response = await apiRequest<unknown>(
          BLOCKS_API,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

        const rawBlock = unwrapData(response);

        if (!isRecord(rawBlock)) {
          throw new Error("The server did not return the created block.");
        }

        const createdBlock = normalizeBlock(
          rawBlock as unknown as ApiContentBlock,
        );

        if (!createdBlock.id) {
          throw new Error("The created block is missing its ID.");
        }

        // Replace the temporary draft with the persisted block.
        setBlocks((current) =>
          current.map((block) =>
            block.id === updatedBlock.id
              ? createdBlock
              : block,
          ),
        );
      } else {
        // UPDATE: Existing blocks continue using PATCH.
        await apiRequest<unknown>(
          `${BLOCKS_API}/${encodeURIComponent(updatedBlock.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );

        setBlocks((current) =>
          current.map((block) =>
            block.id === updatedBlock.id
              ? updatedBlock
              : block,
          ),
        );
      }

      setEditing(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save block.",
      );

      throw err;
    } finally {
      setSaving(false);
    }
  };

  // ------------------- DELETE BLOCK --------------------

  const deleteBlock = async (block: ContentBlock) => {
    if (saving) return;

    const confirmed = window.confirm("Delete this block?");

    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      await apiRequest<unknown>(
        `${BLOCKS_API}/${encodeURIComponent(block.id)}`,
        { method: "DELETE" },
      );

      setBlocks((current) =>
        current
          .filter((item) => item.id !== block.id)
          .map((item, index) => ({
            ...item,
            order: index,
          })),
      );

      if (editing === block.id) {
        setEditing(null);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not delete block.",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelBlock = (block: ContentBlock) => {
    // Remove only temporary drafts.
    if (block.id.startsWith("draft-")) {
      setBlocks((current) =>
        current.filter((item) => item.id !== block.id),
      );
    }

    setEditing(null);
  };

  // ----------------------- RENDER --------------------------
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_48px]">
      <article className="min-w-0 max-w-6xl md:col-start-1 md:row-start-1">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          {language}
        </p>

        <h1 className="mt-2 font-display text-3xl font-bold text-foreground md:text-3xl">
          {topic.title}
        </h1>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {saving && (
          <p className="mt-3 text-xs text-muted-foreground">
            Saving changes...
          </p>
        )}

        <div className="mt-8 space-y-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading content...
            </p>
          ) : blocks.length === 0 ? (
            <p className="text-muted-foreground">
              No content yet — add a heading, text, or code below.
            </p>
          ) : (
            blocks.map((block) =>
              editing === block.id ? (
                <div
                  key={block.id}
                  id={`block-${block.id}`}
                  className="scroll-mt-24"
                >
                  {block.type === "whiteboard" ? (
                    <WhiteboardEditor
                      block={block}
                      onCancel={() => cancelBlock(block)}
                      onSave={saveBlock}
                    />
                  ) : (
                    <BlockEditor
                      block={block}
                      disabled={saving}
                      isNew={block.id.startsWith("draft-")}
                      onCancel={() => cancelBlock(block)}
                      onSave={saveBlock}
                    />
                  )}
                </div>
              ) : (
                <div key={block.id} className="group relative">

                  <BlockView block={block} />

                  <div className="absolute -top-3 right-12 flex gap-1 rounded-md border border-border bg-card p-0.5 opacity-0 shadow transition-opacity group-hover:opacity-100 max-md:opacity-100">
                    <button
                      type="button"
                      onClick={() => setEditing(block.id)}
                      disabled={saving}
                      aria-label="Edit block"
                      className="rounded p-1 text-muted-foreground hover:text-primary disabled:opacity-40"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteBlock(block)}
                      disabled={saving}
                      aria-label="Delete block"
                      className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </article>

      {/* Block creation toolbar */}
      <aside className="order-first min-w-0 self-start border md:sticky bottom-0 md:top-28 md:order-0 md:col-start-2 md:row-start-1">
        <div className="flex min-w-0 items-center gap-2 md:flex-col">

          {/* Mobile: Scroll left */}
          <button
            type="button"
            title="Scroll left"
            aria-label="Scroll toolbar left"
            onClick={() =>
              toolbarRef.current?.scrollBy({
                left: -180,
                behavior: "smooth",
              })
            }
            className="
        flex h-9 w-9 shrink-0 items-center justify-center
        rounded-lg border border-border bg-card
        text-muted-foreground transition-colors
        hover:bg-muted hover:text-foreground
        md:hidden
      "
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Desktop: Scroll up */}
          <button
            type="button"
            title="Scroll up"
            aria-label="Scroll toolbar up"
            onClick={() =>
              toolbarRef.current?.scrollBy({
                top: -180,
                behavior: "smooth",
              })
            }
            className="
        hidden h-9 w-9 shrink-0 items-center justify-center
        rounded-lg border border-border bg-card
        text-muted-foreground transition-colors
        hover:bg-muted hover:text-foreground
        md:flex
      "
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          {/* Scrollable toolbar */}
          <div
            ref={toolbarRef}
            className="
        flex min-w-0 flex-1 flex-row gap-1.5
        overflow-x-auto overflow-y-hidden py-1

        md:max-h-[calc(100dvh-16rem)]
        md:flex-none md:flex-col md:gap-1.5
        md:overflow-x-hidden md:overflow-y-auto

        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
      "
          >
            {(
              [
                ["heading", Heading1, "Heading 1", 1],
                ["heading", Heading2, "Heading 2", 2],
                ["heading", Heading3, "Heading 3", 3],
                ["heading", Heading4, "Heading 4", 4],
                ["heading", Heading5, "Heading 5", 5],
                ["heading", Heading6, "Heading 6", 6],
                ["text", Type, "Text", undefined],
                ["code", Code2, "Code", undefined],
                ["image", ImageIcon, "Image", undefined],
                ["video", Video, "Video", undefined],
                ["file", FileText, "File", undefined],
                ["table", Table2, "Table", undefined],
                ["link", Link2, "Link", undefined],
                ["tags", Tags, "Tags", undefined],
                ["whiteboard", Brush, "Whiteboard", undefined],
              ] as const
            ).map(([type, Icon, label, level]) => {
              const activeEditingBlock = blocks.find(
                (block) => block.id === editing,
              );

              const isActive =
                activeEditingBlock?.type === type &&
                (type !== "heading" || activeEditingBlock.level === level);

              return (
                <div
                  key={label}
                  className="
            group relative flex shrink-0 justify-center
            md:w-full md:justify-end
          "
                >
                  <button
                    type="button"
                    aria-label={`Add ${label}`}
                    disabled={saving || loading}
                    onClick={() => {
                      if (type === "heading") {
                        addBlock("heading", level as 1 | 2 | 3 | 4 | 5 | 6);
                      } else {
                        addBlock(type);
                      }
                    }}
                    className={`
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-xl border border-border/70
              bg-card text-muted-foreground
              shadow-sm transition-all duration-200

              hover:border-primary/40
              hover:bg-primary/10
              hover:text-primary
              hover:shadow-md

               ${isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-border/70 bg-card text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-primary/10 hover:text-primary hover:shadow-md"
                      }

              active:scale-95

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary
              focus-visible:ring-offset-2

              disabled:pointer-events-none
              disabled:opacity-40
            `}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </button>

                  {/* Tooltip on the left side */}
                  <span
                    role="tooltip"
                    className="
    pointer-events-none absolute right-14 top-1/2 z-[99]
    hidden -translate-y-1/2 translate-x-1
    whitespace-nowrap rounded-lg
    border border-border
    bg-popover px-3 py-2
    text-xs font-medium text-popover-foreground
    opacity-0 shadow-lg
    transition-all duration-150

    group-hover:translate-x-0
    group-hover:opacity-100

    group-focus-within:translate-x-0
    group-focus-within:opacity-100

    md:block
  "
                  >
                    Add {label}

                    <span
                      className="
      absolute -right-1 top-1/2
      h-2 w-2 -translate-y-1/2 rotate-45
      border-r border-t border-border
      bg-popover
    "
                    />
                  </span>
                </div>
              )
            })}
          </div>

          {/* Mobile: Scroll right */}
          <button
            type="button"
            title="Scroll right"
            aria-label="Scroll toolbar right"
            onClick={() =>
              toolbarRef.current?.scrollBy({
                left: 180,
                behavior: "smooth",
              })
            }
            className="
        flex h-9 w-9 shrink-0 items-center justify-center
        rounded-lg border border-border bg-card
        text-muted-foreground transition-colors
        hover:bg-muted hover:text-foreground
        md:hidden
      "
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Desktop: Scroll down */}
          <button
            type="button"
            title="Scroll down"
            aria-label="Scroll toolbar down"
            onClick={() =>
              toolbarRef.current?.scrollBy({
                top: 180,
                behavior: "smooth",
              })
            }
            className="
        hidden h-9 w-9 shrink-0 items-center justify-center
        rounded-lg border border-border bg-card
        text-muted-foreground transition-colors
        hover:bg-muted hover:text-foreground
        md:flex
      "
          >
            <ChevronDown className="h-4 w-4" />
          </button>

        </div>
      </aside>
    </div>
  );
}

// -------------------- BLOCK EDITOR ----------------------
function BlockEditor({ block, disabled, onCancel, onSave, isNew }: {
  block: ContentBlock;
  disabled: boolean;
  isNew: boolean;
  onCancel: () => void;
  onSave: (block: ContentBlock) => Promise<void>;
}) {
  // Your backend uses "text" instead of the old "content" field.
  const [text, setText] = useState(block.text ?? "");
  const [code, setCode] = useState(block.code ?? "");
  const [codeLanguage, setCodeLanguage] = useState(
    block.language ?? "javascript",
  );
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5 | 6>(
    block.level ?? 2,
  );

  const [colors, setColors] = useState<TextColorRange[]>(
    block.colors ??
    (block.color && block.text
      ? [
        {
          start: 0,
          end: block.text.length,
          color: block.color,
        },
      ]
      : []),
  );

  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
  });

  const textRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [filename, setFilename] = useState(block.filename ?? "");
  const [url, setUrl] = useState(block.url ?? "");
  const [alt, setAlt] = useState(block.alt ?? "");
  const [caption, setCaption] = useState(block.caption ?? "");

  const [link, setLink] = useState(block.link ?? "");

  const [tags, setTags] = useState<string[]>(block.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const [variant, setVariant] = useState<CalloutVariant>(
    block.variant ?? "info",
  );

  const [formError, setFormError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [table, setTable] = useState(
    block.table ?? {
      columns: ["Column 1", "Column 2"],
      rows: [["", ""]],
    },
  );
  const [pastedTableData, setPastedTableData] = useState("");

  const supportsTextColors =
    block.type === "heading" ||
    block.type === "text" ||
    block.type === "callout";

  const selected = selection.end > selection.start;

  const selectedColor =
    colors.find(
      (range) =>
        range.start <= selection.start &&
        range.end >= selection.end,
    )?.color ?? "";

  const applyColor = (color: NoteColor | "") => {
    if (!selected) return;

    setColors((ranges) =>
      applyTextColor(ranges, selection.start, selection.end, color),
    );

    // Keep the selection so the user can apply another color.
    requestAnimationFrame(() => {
      textRef.current?.focus();
      textRef.current?.setSelectionRange(
        selection.start,
        selection.end,
      );
    });
  };

  const handleTextChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = event.currentTarget.value;

    setColors((ranges) => updateTextColors(ranges, text, value));
    setText(value);

    setSelection({
      start: event.currentTarget.selectionStart,
      end: event.currentTarget.selectionEnd,
    });
  };

  const importPastedTable = () => {
    setFormError(null);

    if (!pastedTableData.trim()) {
      setFormError("Please paste some table data first.");
      return;
    }

    // Split clipboard data into rows.
    const lines = pastedTableData
      .split(/\r\n|\n|\r/)
      .filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      setFormError("No valid table data found.");
      return;
    }

    // Split each row into cells using tabs.
    const parsedRows = lines.map((line) =>
      line.split("\t").map((cell) => cell.trim()),
    );

    // The first row always contains column headers.
    const columns = parsedRows[0];

    if (!columns || columns.length === 0) {
      setFormError("Could not identify table headers.");
      return;
    }

    // Handle rows containing more cells than the header row.
    const maxColumns = Math.max(
      columns.length,
      ...parsedRows.map((row) => row.length),
    );

    const finalColumns = [...columns];

    while (finalColumns.length < maxColumns) {
      finalColumns.push(`Column ${finalColumns.length + 1}`);
    }

    // Everything after the first row becomes table data.
    const rows = parsedRows.slice(1).map((row) =>
      Array.from(
        { length: maxColumns },
        (_, index) => row[index] ?? "",
      ),
    );

    setTable({
      columns: finalColumns,
      rows,
    });

    setPastedTableData("");
  };

  const addTag = () => {
    const newTag = tagInput.trim();

    if (!newTag) return;

    if (
      tags.some(
        (tag) => tag.toLowerCase() === newTag.toLowerCase(),
      )
    ) {
      setTagInput("");
      return;
    }

    setTags((current) => [...current, newTag]);
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags((current) =>
      current.filter((tag) => tag !== tagToRemove),
    );
  };


  const handleSave = async () => {
    setFormError(null);

    const updatedBlock: ContentBlock = {
      ...block,
    };

    if (block.type === "heading") {
      updatedBlock.text = text;
      updatedBlock.level = level;
      updatedBlock.colors = colors;
    } else if (block.type === "text") {
      updatedBlock.text = text;
      updatedBlock.colors = colors;
    } else if (block.type === "callout") {
      updatedBlock.text = text;
      updatedBlock.variant = variant;
      updatedBlock.colors = colors;
    } else if (block.type === "code") {
      updatedBlock.code = code;
      updatedBlock.language = codeLanguage.trim() || "text";
      updatedBlock.filename = filename.trim();

      // Code is stored separately from text and its color ranges.
      delete updatedBlock.colors;
      delete updatedBlock.color;
    } else if (
      block.type === "image" ||
      block.type === "video" ||
      block.type === "audio" ||
      block.type === "file"
    ) {
      updatedBlock.url = url.trim();
      updatedBlock.alt = alt.trim();
      updatedBlock.caption = caption.trim();
      updatedBlock.filename = filename.trim();
    } else if (block.type === "table") {
      if (
        table.columns.length === 0 ||
        table.columns.some((column) => !column.trim())
      ) {
        setFormError("Every column must have a name.");
        return;
      }

      updatedBlock.table = table;
    } else if (block.type === "link") {
      if (!text.trim()) {
        setFormError("Please enter link text.");
        return;
      }

      if (!link.trim()) {
        setFormError("Please enter a URL.");
        return;
      }

      updatedBlock.text = text.trim();
      updatedBlock.link = link.trim();

    } else if (block.type === "tags") {
      if (tags.length === 0) {
        setFormError("Please add at least one tag.");
        return;
      }

      updatedBlock.tags = tags;
    }


    try {
      await onSave(updatedBlock);
    } catch (error: unknown) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not save your changes.",
      );
    }
  };

  const handleFileUpload = async (file: File) => {
    setFormError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Get temporary authentication credentials from your backend.
      const authResponse = await apiRequest<ImageKitAuthResponse>(
        IMAGEKIT_AUTH_API,
      );

      // Upload directly from the browser to ImageKit.
      const result = await upload({
        file,
        fileName: file.name,
        ...authResponse.data,
        folder: `/lms/${block.type}`,
        useUniqueFileName: true,

        onProgress: (event) => {
          setUploadProgress(
            Math.round((event.loaded / event.total) * 100),
          );
        },
      });

      // Store the returned URL in the existing URL field.
      if (!result.url) {
        throw new Error("ImageKit did not return a file URL.");
      }
      setUrl(result.url);
      setFilename(result.name ?? file.name);
    } catch (error: unknown) {
      setFormError(
        error instanceof Error
          ? error.message
          : "File upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };

  const updateColumn = (index: number, value: string) => {
    setTable((current) => ({
      ...current,
      columns: current.columns.map((column, i) =>
        i === index ? value : column,
      ),
    }));
  };

  const updateCell = (
    rowIndex: number,
    columnIndex: number,
    value: string,
  ) => {
    setTable((current) => ({
      ...current,
      rows: current.rows.map((row, i) =>
        i === rowIndex
          ? row.map((cell, j) =>
            j === columnIndex ? value : cell,
          )
          : row,
      ),
    }));
  };

  const addColumn = () => {
    setTable((current) => ({
      columns: [
        ...current.columns,
        `Column ${current.columns.length + 1}`,
      ],
      rows: current.rows.map((row) => [...row, ""]),
    }));
  };

  const removeColumn = (index: number) => {
    setTable((current) => ({
      columns: current.columns.filter((_, i) => i !== index),
      rows: current.rows.map((row) =>
        row.filter((_, i) => i !== index),
      ),
    }));
  };

  const addRow = () => {
    setTable((current) => ({
      ...current,
      rows: [
        ...current.rows,
        current.columns.map(() => ""),
      ],
    }));
  };

  const removeRow = (index: number) => {
    setTable((current) => ({
      ...current,
      rows: current.rows.filter((_, i) => i !== index),
    }));
  };

  const handleCancel = () => {
    if (isNew) {
      let hasContent = false;

      switch (block.type) {
        case "heading":
        case "text":
        case "callout":
          hasContent = text.trim().length > 0;
          break;

        case "code":
          hasContent = code.trim().length > 0;
          break;

        case "image":
        case "video":
        case "audio":
        case "file":
          hasContent =
            url.trim().length > 0 ||
            alt.trim().length > 0 ||
            caption.trim().length > 0 ||
            filename.trim().length > 0;
          break;

        case "link":
          hasContent =
            text.trim().length > 0 ||
            link.trim().length > 0;
          break;

        case "tags":
          hasContent = tags.length > 0;
          break;

        case "table":
          hasContent =
            table.columns.some(
              (column, index) =>
                column !== `Column ${index + 1}`,
            ) ||
            table.rows.some((row) =>
              row.some((cell) => cell.trim().length > 0),
            );
          break;

        default:
          break;
      }

      if (hasContent) {
        const confirmed = window.confirm(
          "Are you sure you want to cancel without saving? All entered content will be lost.",
        );

        if (!confirmed) return;
      }
    }

    onCancel();
  };

  return (
    <div className="space-y-3 rounded-xl border border-primary bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-wide text-primary">
          {block.type === "heading"
            ? `Heading ${level}`
            : block.type}
        </span>

        {block.type === "heading" && (
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5, 6] as const).map((item) => (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => setLevel(item)}
                className={`rounded px-2 py-1 font-mono text-xs ${level === item
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
                  }`}
              >
                H{item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text color toolbar */}
      {supportsTextColors && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-xs text-muted-foreground">
            Text color
          </span>

          {NOTE_COLORS.map((item) => (
            <button
              key={item.key || "default"}
              type="button"
              title={
                selected
                  ? item.label
                  : "Select text first"
              }
              aria-label={item.label}
              disabled={disabled || !selected}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyColor(item.key)}
              style={
                item.value
                  ? { backgroundColor: item.value }
                  : undefined
              }
              className={`h-6 w-6 rounded-full border transition-shadow ${selectedColor === item.key && selected
                ? "border-foreground ring-2 ring-ring"
                : "border-border"
                } ${item.value ? "" : "bg-background"
                } disabled:cursor-not-allowed disabled:opacity-40`}
            />
          ))}

          <span className="text-xs text-muted-foreground">
            {selected
              ? `${selection.end - selection.start} characters selected`
              : "Select text to apply a color"}
          </span>
        </div>
      )}

      {/* Heading, text and callout editor */}
      {supportsTextColors && (
        <>
          {block.type === "callout" && (
            <label className="block text-sm">
              Callout style

              <select
                value={variant}
                disabled={disabled}
                onChange={(event) =>
                  setVariant(
                    event.target.value as CalloutVariant,
                  )
                }
                className="mt-1 block w-full rounded-md border border-input bg-background p-2"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="danger">Danger</option>
              </select>
            </label>
          )}

          <div
            className={`note-text-editor relative overflow-hidden rounded-md border border-input bg-background ${block.type === "heading"
              ? "font-display text-xl font-bold"
              : "text-sm"
              }`}
          >
            {/* Colored text preview behind the textarea */}
            <div
              ref={previewRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap wrap-break-words px-3 py-2 text-foreground"
            >
              <ColoredText content={text} colors={colors} />
              {"\n"}
            </div>

            {/* Transparent text lets the colored preview show through */}
            <textarea
              ref={textRef}
              autoFocus
              aria-label={
                block.type === "heading"
                  ? "Heading content"
                  : block.type === "callout"
                    ? "Callout content"
                    : "Text content"
              }
              value={text}
              disabled={disabled}
              rows={block.type === "heading" ? 2 : 5}
              onSelect={(event) => {
                setSelection({
                  start: event.currentTarget.selectionStart,
                  end: event.currentTarget.selectionEnd,
                });
              }}
              onScroll={(event) => {
                if (previewRef.current) {
                  previewRef.current.scrollTop =
                    event.currentTarget.scrollTop;
                  previewRef.current.scrollLeft =
                    event.currentTarget.scrollLeft;
                }
              }}
              onChange={handleTextChange}
              spellCheck={false}
              className="relative block w-full resize-y bg-transparent px-3 py-2 text-transparent caret-foreground outline-none selection:bg-primary/20"
            />
          </div>
        </>
      )}

      {/* Code editor */}
      {block.type === "code" && (
        <>
          <label className="block text-sm">
            Programming language

            <input
              value={codeLanguage}
              disabled={disabled}
              onChange={(event) =>
                setCodeLanguage(event.target.value)
              }
              placeholder="javascript"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
          </label>

          <label className="block text-sm">
            Filename (optional)

            <input
              value={filename}
              disabled={disabled}
              onChange={(event) =>
                setFilename(event.target.value)
              }
              placeholder="example.js"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </label>

          <textarea
            autoFocus
            value={code}
            disabled={disabled}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Write your code..."
            rows={8}
            spellCheck={false}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground outline-none"
          />
        </>
      )}

      {/* Image, video, audio and file editor */}
      {(
        ["image", "video", "audio", "file"] as const
      ).includes(block.type as "image" | "video" | "audio" | "file") && (
          <>
            <label className="block text-sm">
              Media URL

              <input
                value={url}
                disabled={disabled}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              Upload from computer

              <input
                type="file"
                disabled={disabled || uploading}
                accept={
                  block.type === "image"
                    ? "image/*"
                    : block.type === "video"
                      ? "video/*"
                      : block.type === "audio"
                        ? "audio/*"
                        : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                }
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];

                  if (file) {
                    void handleFileUpload(file);
                  }

                  // Allow selecting the same file again.
                  event.currentTarget.value = "";
                }}
                className="mt-1 block w-full text-sm"
              />
            </label>

            {uploading && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Uploading... {uploadProgress}%
                </p>

                <progress
                  value={uploadProgress}
                  max={100}
                  className="w-full"
                />
              </div>
            )}

            <label className="block text-sm">
              Filename (optional)

              <input
                value={filename}
                disabled={disabled}
                onChange={(event) =>
                  setFilename(event.target.value)
                }
                placeholder="example.pdf"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              Alt text

              <input
                value={alt}
                disabled={disabled}
                onChange={(event) => setAlt(event.target.value)}
                placeholder="Describe the media"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              Caption

              <input
                value={caption}
                disabled={disabled}
                onChange={(event) =>
                  setCaption(event.target.value)
                }
                placeholder="Optional caption"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>
          </>
        )}

      {/* Link editor */}
      {block.type === "link" && (
        <div className="space-y-3">
          <label className="block text-sm">
            Link text

            <input
              value={text}
              disabled={disabled}
              onChange={(event) => setText(event.target.value)}
              placeholder="React documentation"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            URL

            <input
              type="url"
              value={link}
              disabled={disabled}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://react.dev"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </label>
        </div>
      )}



      {block.type === "table" && (
        <div className="space-y-3">

          {/* Paste table data */}
          <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">

            <label className="block text-sm font-medium">
              Paste table data
            </label>

            <textarea
              value={pastedTableData}
              disabled={disabled}
              onChange={(event) =>
                setPastedTableData(event.target.value)
              }
              placeholder={`First name\tLast name\tAge\tGender
Tinu\tElejogun\t14\tF
Javier\tZapata\t28\tM
Lily\tMcGarrett\t18\tF`}
              rows={5}
              className="w-full rounded-md border border-input bg-background p-3 font-mono text-sm"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">

              <p className="text-xs text-muted-foreground">
                First row will be used as column headers.
              </p>

              <button
                type="button"
                disabled={disabled || !pastedTableData.trim()}
                onClick={importPastedTable}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Import table
              </button>

            </div>
          </div>

          {/* Existing manual table editor */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {table.columns.map((column, columnIndex) => (
                    <th
                      key={columnIndex}
                      className="border border-border p-2"
                    >
                      <input
                        value={column}
                        disabled={disabled}
                        onChange={(event) =>
                          updateColumn(columnIndex, event.target.value)
                        }
                        className="w-full bg-background p-1 font-semibold"
                        placeholder="Column name"
                      />

                      <button
                        type="button"
                        disabled={disabled || table.columns.length <= 1}
                        onClick={() => removeColumn(columnIndex)}
                        className="mt-1 text-xs text-destructive"
                      >
                        Remove column
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, columnIndex) => (
                      <td
                        key={columnIndex}
                        className="border border-border p-2"
                      >
                        <input
                          value={cell}
                          disabled={disabled}
                          onChange={(event) =>
                            updateCell(
                              rowIndex,
                              columnIndex,
                              event.target.value,
                            )
                          }
                          className="w-full min-w-24 bg-background p-1"
                          placeholder="Enter data"
                        />
                      </td>
                    ))}

                    <td className="border border-border p-2">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => removeRow(rowIndex)}
                        className="text-xs text-destructive"
                      >
                        Remove row
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={addColumn}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              Add column
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={addRow}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              Add row
            </button>
          </div>
        </div>
      )}

      {/* Tags editor */}
      {block.type === "tags" && (
        <div className="space-y-2">

          <div className="flex gap-2">

            <input
              value={tagInput}
              disabled={disabled}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="Enter a tag..."
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />

            <button
              type="button"
              disabled={disabled || !tagInput.trim()}
              onClick={addTag}
              className="rounded-md border border-border px-3 py-2 text-sm hover:border-primary disabled:opacity-50"
            >
              Add tag
            </button>

          </div>

          <div className="flex flex-wrap gap-2">

            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs"
              >
                {tag}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag} tag`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}

          </div>
        </div>
      )}



      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={disabled || uploading}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={disabled || uploading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );
}

// ------------------ BLOCK VIEW ---------------------

function BlockView({ block }: { block: ContentBlock }) {
  const headingClass =
    "font-display font-bold text-foreground";

  switch (block.type) {
    case "heading": {
      const className =
        block.level === 1
          ? `text-3xl md:text-4xl ${headingClass}`
          : block.level === 2
            ? `text-2xl ${headingClass}`
            : block.level === 3
              ? `text-xl ${headingClass}`
              : block.level === 4
                ? `text-lg ${headingClass}`
                : block.level === 5
                  ? `text-base ${headingClass}`
                  : `text-sm ${headingClass}`;

      const heading = block.text ?? "";

      switch (block.level ?? 2) {
        case 1:
          return <h1 className={className}>{heading}</h1>;
        case 2:
          return <h2 className={className}>{heading}</h2>;
        case 3:
          return <h3 className={className}>{heading}</h3>;
        case 4:
          return <h4 className={className}>{heading}</h4>;
        case 5:
          return <h5 className={className}>{heading}</h5>;
        default:
          return <h6 className={className}>{heading}</h6>;
      }
    }

    case "text":
      return (
        <p style={{ color: block.color }} className="whitespace-pre-wrap leading-relaxed text-foreground/85">
          <ColoredText
            content={block.text ?? ""}
            colors={block.colors ?? []}
          />
        </p>
      );

    case "code":
      if (!(block.code ?? "").trim()) {
        return null;
      }
      return (
        <CodeBlock block={block} />
      );

    case "image":
      return (
        <figure className="space-y-2">
          {block.url ? (
            <img
              src={block.url}
              alt={block.alt ?? ""}
              className="max-h-[500px] rounded-lg object-contain"
            />
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              No image URL provided.
            </div>
          )}

          {block.caption && (
            <figcaption className="text-sm text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "video":
      return block.url ? (
        <figure className="space-y-2">
          <video
            src={block.url}
            controls
            className="w-full rounded-lg"
          />
          {block.caption && (
            <figcaption className="text-sm text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Video className="mr-2 inline h-4 w-4" />
          No video URL provided.
        </p>
      );

    case "audio":
      return block.url ? (
        <figure className="space-y-2">
          <audio src={block.url} controls className="w-full" />
          {block.caption && (
            <figcaption className="text-sm text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Music className="mr-2 inline h-4 w-4" />
          No audio URL provided.
        </p>
      );

    case "file":
      return block.url ? (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-primary underline"
        >
          <FileText className="h-4 w-4" />
          {block.filename || block.caption || "Open file"}
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">
          <FileText className="mr-2 inline h-4 w-4" />
          No file URL provided.
        </p>
      );

    case "callout": {
      const variantClass: Record<CalloutVariant, string> = {
        info: "border-blue-500/40 bg-blue-500/5",
        warning: "border-yellow-500/40 bg-yellow-500/5",
        success: "border-green-500/40 bg-green-500/5",
        danger: "border-destructive/40 bg-destructive/5",
      };

      const variant = block.variant ?? "info";

      return (
        <div
          className={`rounded-md border p-4 ${variantClass[variant]}`}
        >
          <AlertCircle className="mr-2 inline h-4 w-4" />
          <span className="whitespace-pre-wrap">{block.text}</span>
        </div>
      );
    }

    case "link":
      return block.link ? (
        <a
          href={block.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary underline underline-offset-4 hover:opacity-80"
        >
          <Link2 className="h-4 w-4" />
          {block.text || block.link}
        </a>
      ) : null;

    case "tags":
      return (
        <div className="flex flex-wrap gap-2">
          {block.tags?.map((tag) => (
            <span
              key={tag}
              className="
    inline-flex items-center gap-1
    rounded-full border border-blue-400
   text-blue-800
    px-3 py-0.5 text-xs
    transition-colors duration-150
    hover:bg-blue-100 hover:border-blue-500
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
    dark:bg-blue-900 dark:text-blue-200 dark:border-blue-600 dark:hover:bg-blue-800
  "
            >
              <Tags className="w-3 h-3 shrink-0 text-blue-600 dark:text-blue-300" />
              {tag}
            </span>
          ))}
        </div>
      );

    case "table":
      if (!block.table) return null;

      return (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary">
                {block.table.columns.map((column, index) => (
                  <th
                    key={index}
                    className="border border-border px-4 py-3 text-left font-semibold"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {block.table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="border border-border px-4 py-3"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "whiteboard":
      return block.url ? (
        <figure className="space-y-2">
          <img
            src={block.url}
            alt="Whiteboard drawing"
            className="w-full rounded-lg border border-border object-contain"
          />

          <figcaption className="text-xs text-muted-foreground">
            Whiteboard
          </figcaption>
        </figure>
      ) : (
        <p className="text-sm text-muted-foreground">
          Empty whiteboard.
        </p>
      );

    default:
      return null;
  }
}