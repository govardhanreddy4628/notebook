import { useEffect, useState } from "react";
import { ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import type { Topic } from "@/types";

const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8080").replace(/\/+$/, "");

const TOPICS_API = `${API_BASE_URL}/api/v1/topics`;

type TopicNode = Topic & {
  children: TopicNode[];
};

type TopicTreeProps = {
  topics: TopicNode[];
  activeId?: string | undefined;
  onSelect: (id: string) => void;
  onReload: () => Promise<void>;
  languageId: string;
};

export function TopicTree({
  topics,
  activeId,
  onSelect,
  onReload,
  languageId,
}: TopicTreeProps) {
  return (
    <ul>
      {topics.map((topic) => (
        <TreeItem
          key={topic.id}
          tp={topic}
          activeId={activeId}
          onSelect={onSelect}
          onReload={onReload}
          languageId={languageId}
          depth={0}
        />
      ))}
    </ul>
  );
}

function containsId(tp: TopicNode, id?: string): boolean {
  return (
    !!id &&
    (tp.id === id || tp.children.some((child) => containsId(child, id)))
  );
}

async function topicRequest(
  url: string,
  options: RequestInit = {},
): Promise<void> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      body?.message ||
        body?.error ||
        `Topic request failed (${response.status})`,
    );
  }
}

type TreeItemProps = {
  tp: TopicNode;
  activeId?: string | undefined;
  onSelect: (id: string) => void;
  onReload: () => Promise<void>;
  languageId: string;
  depth: number;
};

export function TreeItem({
  tp,
  activeId,
  onSelect,
  onReload,
  languageId,
  depth,
}: TreeItemProps) {
  const [expanded, setExpanded] = useState(
    () => containsId(tp, activeId) || depth === 0,
  );
  const [saving, setSaving] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  const active = tp.id === activeId;
  const hasKids = tp.children.length > 0;

  useEffect(() => {
    if (containsId(tp, activeId)) {
      setExpanded(true);
    }
  }, [tp, activeId]);

  const runRequest = async (action: () => Promise<void>) => {
    setSaving(true);
    setItemError(null);

    try {
      await action();
      await onReload();
    } catch (error) {
      setItemError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  };

  const addSub = () => {
    const title = window.prompt(`Subtopic of "${tp.title}"`)?.trim();
    if (!title) return;

    void runRequest(async () => {
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const response = await fetch(TOPICS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: languageId,
          parentTopic: tp.id,
          title,
          slug,
          order: tp.children.length,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.message || body?.error || "Could not create subtopic.",
        );
      }

      const result = await response.json().catch(() => null);
      const created = result?.data ?? result;
      const createdId = created?._id ?? created?.id;

      setExpanded(true);

      if (createdId) {
        onSelect(createdId);
      }
    });
  };

  const rename = () => {
    const title = window.prompt("Rename topic", tp.title)?.trim();
    if (!title || title === tp.title) return;

    void runRequest(async () => {
      await topicRequest(`${TOPICS_API}/${encodeURIComponent(tp.id)}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      });
    });
  };

  const del = () => {
    if (
      !window.confirm(
        `Delete "${tp.title}" and its subtopics?`,
      )
    ) {
      return;
    }

    void runRequest(async () => {
      // Your backend must delete descendants and related content blocks
      // if you want cascading deletion.
      await topicRequest(`${TOPICS_API}/${encodeURIComponent(tp.id)}`, {
        method: "DELETE",
      });
    });
  };

  return (
    <li>
      <div
        className={`group flex items-center gap-1 rounded-md pr-1 text-sm ${
          active
            ? "bg-sidebar-accent text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60"
        }`}
      >
        <button
          onClick={() => setExpanded((current) => !current)}
          className={`p-1 text-muted-foreground ${
            hasKids ? "" : "invisible"
          }`}
          aria-label={expanded ? "Collapse topic" : "Expand topic"}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>

        <button
          onClick={() => onSelect(tp.id)}
          className="min-w-0 flex-1 truncate py-1.5 text-left"
        >
          {tp.title}
        </button>

        <span className="flex opacity-60 group-hover:opacity-100">
          <button
            onClick={addSub}
            disabled={saving}
            aria-label="Add subtopic"
            className="rounded p-1 hover:text-primary disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={rename}
            disabled={saving}
            aria-label="Rename topic"
            className="rounded p-1 hover:text-primary disabled:opacity-40"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={del}
            disabled={saving}
            aria-label="Delete topic"
            className="rounded p-1 hover:text-destructive disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      {itemError && (
        <p className="px-2 py-1 text-xs text-destructive">{itemError}</p>
      )}

      {expanded && hasKids && (
        <ul className="ml-3 border-l border-sidebar-border pl-2">
          {tp.children.map((child) => (
            <TreeItem
              key={child.id}
              tp={child}
              activeId={activeId}
              onSelect={onSelect}
              onReload={onReload}
              languageId={languageId}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}