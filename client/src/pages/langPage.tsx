// import { useState } from "react";
// import { Link, useParams, useSearchParams } from "react-router-dom";
// import {Plus,Menu,X } from "lucide-react";
// import { TopNav } from "@/components/layout/TopNav";
// import {
//   findTopic,
//   mapTopic,
//   newTopic,
// } from "@/lib/notes-store";
// import { useLanguageData } from "@/hooks/useLanguages";
// import { Language, Topic } from "@/types";

// // --------------------------------------------------
// // API CONFIGURATION
// // --------------------------------------------------

// const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
// const LANGUAGES_API = `${API_BASE_URL}/api/v1/languages`;



// async function saveLanguage(language: Language): Promise<void> {
//   const response = await fetch(
//     `${LANGUAGES_API}/${encodeURIComponent(language._id)}`,
//     {
//       method: "PUT",
//       credentials: "include",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(language),
//     }
//   );

//   // Supports both JSON responses and empty successful responses.
//   if (!response.ok) {
//     const body = await response.json().catch(() => null);

//     throw new Error(
//       body?.message ||
//         body?.error ||
//         `Could not save changes (${response.status})`
//     );
//   }
// }


// // -------------------- LANGUAGE PAGE ----------------------

// export default function LangPage() {
//   const { lang } = useParams<{ lang: string }>();
//   const [searchParams, setSearchParams] = useSearchParams();

//   const topicId = searchParams.get("topic");

//   const {
//     languages,
//     setLanguages,
//     loading,
//     error,
//     setError,
//   } = useLanguageData();

//   const language = languages.find((item) => item._id === lang);

//   const [open, setOpen] = useState(false);
//   const [saving, setSaving] = useState(false);

//   // Update React state immediately and persist the complete language document.
//   const updateTopics = (update: (topics: Topic[]) => Topic[]) => {
//     if (!language) return;

//     const updatedLanguage: Language = {
//       ...language,
//       topics: update(language.topics),
//     };

//     setLanguages((current) =>
//       current.map((item) =>
//         item._id === updatedLanguage._id ? updatedLanguage : item
//       )
//     );

//     setSaving(true);
//     setError(null);

//     void saveLanguage(updatedLanguage)
//       .catch((err: unknown) => {
//         setError(
//           err instanceof Error
//             ? `Your changes may not have been saved: ${err.message}`
//             : "Your changes may not have been saved."
//         );
//       })
//       .finally(() => {
//         setSaving(false);
//       });
//   };

//   const select = (id: string) => {
//     setSearchParams({ topic: id });
//     setOpen(false);
//   };

//   const addRootTopic = () => {
//     const title = window.prompt("Topic title");

//     if (!title?.trim()) return;

//     const newTopicItem = newTopic(title.trim());

//     updateTopics((topics) => [...topics, newTopicItem]);
//     select(newTopicItem.id);
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-background">
//         <TopNav />
//         <div className="p-10 text-center text-muted-foreground">
//           Loading language...
//         </div>
//       </div>
//     );
//   }

//   // API error before any language has loaded
//   if (error && !language && languages.length === 0) {
//     return (
//       <div className="min-h-screen bg-background">
//         <TopNav />
//         <div className="mx-auto max-w-2xl p-10 text-center">
//           <p className="text-destructive">{error}</p>
//           <Link to="/" className="mt-4 inline-block text-primary underline">
//             Go home
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   // Language not found
//   if (!language) {
//     return (
//       <div className="min-h-screen bg-background">
//         <TopNav />
//         <div className="p-10 text-center text-muted-foreground">
//           Language not found.{" "}
//           <Link to="/" className="text-primary underline">
//             Go home
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const topic =(topicId && findTopic(language.topics, topicId)) || language.topics[0];

//   return (
//     <div className="min-h-screen bg-background">
//       <TopNav />

//       {error && (
//         <div
//           role="alert"
//           className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive"
//         >
//           {error}
//         </div>
//       )}

//       <div className="mx-auto flex max-w-7xl">
//         <aside
//           className={`fixed inset-y-0 left-0 z-40 w-72 shrink-0 overflow-y-auto border-r border-border bg-sidebar p-4 transition-transform md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:translate-x-0 ${
//             open ? "translate-x-0" : "-translate-x-full"
//           }`}
//         >
//           <div className="mb-4 flex items-center justify-between">
//             <h2 className="font-display text-lg font-semibold text-sidebar-foreground">
//               {language.name}
//             </h2>

//             <div className="flex gap-1">
//               <button
//                 onClick={addRootTopic}
//                 aria-label="Add topic"
//                 className="rounded p-1.5 text-primary hover:bg-sidebar-accent"
//               >
//                 <Plus className="h-4 w-4" />
//               </button>

//               <button
//                 onClick={() => setOpen(false)}
//                 aria-label="Close"
//                 className="rounded p-1.5 text-muted-foreground hover:bg-sidebar-accent md:hidden"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             </div>
//           </div>

//           {language.topics.length === 0 && (
//             <p className="text-sm text-muted-foreground">
//               No topics yet. Click + to add one.
//             </p>
//           )}

//           <TopicTree
//             topics={language.topics}
//             activeId={topic?.id}
//             onSelect={select}
//             updateTopics={updateTopics}
//             depth={0}
//           />
//         </aside>

//         {open && (
//           <div
//             className="fixed inset-0 z-30 bg-background/70 md:hidden"
//             onClick={() => setOpen(false)}
//           />
//         )}

//         <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
//           <div className="mb-3 min-h-5 text-right">
//             {saving && (
//               <span className="text-xs text-muted-foreground">
//                 Saving changes...
//               </span>
//             )}
//           </div>

//           <button
//             onClick={() => setOpen(true)}
//             className="mb-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground md:hidden"
//           >
//             <Menu className="h-4 w-4" />
//             Topics
//           </button>

//           {topic ? (
//             <TopicView
//               key={topic.id}
//               topic={topic}
//               language={language.name}
//               update={(update) =>
//                 updateTopics((topics) =>
//                   mapTopic(topics, topic.id, update)
//                 )
//               }
//             />
//           ) : (
//             <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
//               Add a topic from the sidebar to start writing notes.
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }






import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Plus, Menu, X } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { useLanguageData } from "@/hooks/useLanguages";
import type { Topic } from "@/types";
import { TopicTree } from "@/components/topicTree";
import { useTopicsData } from "@/hooks/useTopics";
import { TopicView } from "@/components/TopicView";

// ----------------- API CONFIGURATION -----------------------
const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8080").replace(/\/$/, "");
const TOPICS_API = `${API_BASE_URL}/api/v1/topics`;

// ---------------- API TYPES ------------------------
// MongoDB normally returns _id.
// Normalize it to id for the frontend Topic type.
type ApiTopic = Omit<Topic, "id" | "language" | "parentTopic"> & {
  _id?: string;
  id?: string;
  language: string | { _id: string };
  parentTopic: string | { _id: string } | null;
};

type TopicNode = Topic & {
  children: TopicNode[];
};

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
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
      `Request failed (${response.status})`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}


function normalizeTopic(topic: ApiTopic): Topic {
  const languageId =
    typeof topic.language === "string"
      ? topic.language
      : topic.language._id;

  const parentTopicId =
    topic.parentTopic === null
      ? null
      : typeof topic.parentTopic === "string"
        ? topic.parentTopic
        : topic.parentTopic._id;

  return {
    ...topic,
    id: topic._id ?? topic.id ?? "",
    language: languageId,
    parentTopic: parentTopicId,
  };
}

// Build a display tree from the flat MongoDB topic documents.
function buildTopicTree(topics: Topic[]): TopicNode[] {
  const nodes = new Map<string, TopicNode>();

  for (const topic of topics) {
    nodes.set(topic.id, {
      ...topic,
      children: [],
    });
  }

  const roots: TopicNode[] = [];

  for (const node of nodes.values()) {
    const parentId = node.parentTopic;
    const parent = parentId ? nodes.get(parentId) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (items: TopicNode[]) => {
    items.sort((a, b) => a.order - b.order);

    for (const item of items) {
      sortTree(item.children);
    }
  };

  sortTree(roots);
  return roots;
}


// ------------------- LANGUAGE PAGE ---------------------------
export default function LangPage() {
  const { lang } = useParams<{ lang: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const topicId = searchParams.get("topic");
  const {
    topics,
    setTopics,
    topicsLoading,
    loadTopics,
  } = useTopicsData();

  const {
    languages,
    loading: languagesLoading,
    error: languageError,
  } = useLanguageData();

  const language = languages.find((item) => item._id === lang);

  const [topicError, setTopicError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);


  const topicTree = useMemo(() => buildTopicTree(topics), [topics]);

  const activeTopic =
    topics.find((topic) => topic.id === topicId) ?? topicTree[0] ?? null;

  const select = (id: string) => {
    setSearchParams({ topic: id });
    setOpen(false);
  };

  // Create a root topic in MongoDB.
  const addRootTopic = async () => {
    if (!language?._id) return;

    const title = window.prompt("Topic title")?.trim();
    if (!title) return;

    setSaving(true);
    setTopicError(null);

    try {
      const created = await apiRequest<ApiTopic | { data: ApiTopic }>(
        TOPICS_API,
        {
          method: "POST",
          body: JSON.stringify({
            language: language._id,
            parentTopic: null,
            title,
            slug: title
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, ""),
            order: topics.filter((topic) => topic.parentTopic === null).length,
          }),
        },
      );

      const rawTopic =
        "data" in created ? created.data : created;

      const newTopic = normalizeTopic(rawTopic);

      setTopics((current) => [...current, newTopic]);
      select(newTopic.id);
    } catch (error) {
      setTopicError(
        error instanceof Error ? error.message : "Could not create topic.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (languagesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="p-10 text-center text-muted-foreground">
          Loading language...
        </div>
      </div>
    );
  }

  if (languageError && !language && languages.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="mx-auto max-w-2xl p-10 text-center">
          <p className="text-destructive">{languageError}</p>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (!language) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="p-10 text-center text-muted-foreground">
          Language not found.{" "}
          <Link to="/" className="text-primary underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      {(languageError || topicError) && (
        <div
          role="alert"
          className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive"
        >
          {topicError || languageError}
        </div>
      )}

      <div className="mx-auto flex max-w-11/12">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 shrink-0 overflow-y-auto border-r border-border bg-sidebar p-4 transition-transform md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-sidebar-foreground">
              {language.name}
            </h2>

            <div className="flex gap-1">
              <button
                onClick={() => void addRootTopic()}
                disabled={saving}
                aria-label="Add topic"
                className="rounded p-1.5 text-primary hover:bg-sidebar-accent"
              >
                <Plus className="h-4 w-4" />
              </button>

              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-1.5 text-muted-foreground hover:bg-sidebar-accent md:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {topicsLoading ? (
            <p className="text-sm text-muted-foreground">Loading topics...</p>
          ) : topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No topics yet. Click + to add one.
            </p>
          ) : (
            <TopicTree
              topics={topicTree}
              activeId={activeTopic?.id}
              onSelect={select}
              onReload={loadTopics}
              languageId={language._id}
            />
          )}
        </aside>

        {open && (
          <div
            className="fixed inset-0 z-30 bg-background/70 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1 px-1 py-2 md:pl-6 md:pr-0 md:py-2">
          <div className="mb-1 min-h-4 text-right">
            {saving && (
              <span className="text-xs text-muted-foreground">
                Saving changes...
              </span>
            )}
          </div>

          <button
            onClick={() => setOpen(true)}
            className="mb-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground md:hidden"
          >
            <Menu className="h-4 w-4" />
            Topics
          </button>

          {activeTopic ? (
            <TopicView
              key={activeTopic.id}
              topic={activeTopic}
              language={language.name}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Add a topic from the sidebar to start writing notes.
            </div>
          )}
        </main>


      </div>
    </div>
  );
}