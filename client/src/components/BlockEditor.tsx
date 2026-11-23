import { useRef, useState } from "react";
import {
  applyTextColor,
  textColorSegments,
  updateTextColors,
} from "@/lib/text-colors";

import type { CalloutVariant, ContentBlock, NoteColor, TextColorRange } from "@/types";
import { Save } from "lucide-react";


const NOTE_COLORS: {
  key: NoteColor | "";
  label: string;
  value?: string;
}[] = [
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

function ColoredText({content,colors}: {
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

export function BlockEditor({
  block,
  disabled,
  onCancel,
  onSave,
}: {
  block: ContentBlock;
  disabled: boolean;
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

  const [variant, setVariant] = useState<CalloutVariant>(
    block.variant ?? "info",
  );

  const [formError, setFormError] = useState<string | null>(null);

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
                className={`rounded px-2 py-1 font-mono text-xs ${
                  level === item
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
              className={`h-6 w-6 rounded-full border transition-shadow ${
                selectedColor === item.key && selected
                  ? "border-foreground ring-2 ring-ring"
                  : "border-border"
              } ${
                item.value ? "" : "bg-background"
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
            className={`note-text-editor relative overflow-hidden rounded-md border border-input bg-background ${
              block.type === "heading"
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

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );
}