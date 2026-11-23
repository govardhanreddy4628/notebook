// import { useState, useRef } from "react";
// import { applyTextColor, TextColorRange, textColorSegments, updateTextColors } from "@/lib/text-colors";
// import { Link, useParams, useSearchParams } from "react-router-dom";
// import {ChevronRight,Plus,Trash2,Pencil,Copy,Check,Play,Menu,X,Heading1,Heading2,Heading3,Heading4,Heading5,Heading6,Type,Code2} from "lucide-react";
// import { TopNav } from "@/components/layout/TopNav";
// import {
//   findTopic,
//   mapTopic,
//   newTopic,
//   removeTopic,
//   uid,
//   type Block,
//   type BlockType,
//   type Topic,
//   type Language,
// } from "@/lib/notes-store";
// import { useLanguageData } from "@/hooks/useLanguages";
// import { NoteColor } from "@/types";

// // --------------------------------------------------
// // API CONFIGURATION
// // --------------------------------------------------

// const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
// const LANGUAGES_API = `${API_BASE_URL}/api/v1/languages`;



// async function saveLanguage(language: Language): Promise<void> {
//   const response = await fetch(
//     `${LANGUAGES_API}/${encodeURIComponent(language.id)}`,
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

// // --------------------------------------------------
// // NOTE COLORS
// // --------------------------------------------------

// const NOTE_COLORS: { key: NoteColor | ""; label: string; value?: string;}[] = [
//   { key: "", label: "Default" },
//   { key: "red", label: "Red", value: "var(--note-red)" },
//   { key: "orange", label: "Orange", value: "var(--note-orange)" },
//   { key: "yellow", label: "Yellow", value: "var(--note-yellow)" },
//   { key: "green", label: "Green", value: "var(--note-green)" },
//   { key: "cyan", label: "Cyan", value: "var(--note-cyan)" },
//   { key: "blue", label: "Blue", value: "var(--note-blue)" },
//   { key: "violet", label: "Violet", value: "var(--note-violet)" },
//   { key: "pink", label: "Pink", value: "var(--note-pink)" },
// ];

// function colorValue(color?: NoteColor): string | undefined {
//   return NOTE_COLORS.find((item) => item.key === color)?.value;
// }

// function ColoredText({
//   content,
//   colors,
// }: {
//   content: string;
//   colors: TextColorRange[];
// }) {
//   return (
//     <>
//       {textColorSegments(content, colors).map((segment, index) => (
//         <span
//           key={index}
//           style={{ color: colorValue(segment.color) }}
//         >
//           {segment.text}
//         </span>
//       ))}
//     </>
//   );
// }

// // --------------------------------------------------
// // LANGUAGE PAGE
// // --------------------------------------------------

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

//   const addRoot = () => {
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
//                 onClick={addRoot}
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

// // --------------------------------------------------
// // TOPIC TREE
// // --------------------------------------------------

// function TopicTree({
//   topics,
//   activeId,
//   onSelect,
//   updateTopics,
//   depth,
// }: {
//   topics: Topic[];
//   activeId?: string;
//   onSelect: (id: string) => void;
//   updateTopics: (update: (topics: Topic[]) => Topic[]) => void;
//   depth: number;
// }) {
//   return (
//     <ul className={depth ? "ml-3 border-l border-sidebar-border pl-2" : ""}>
//       {topics.map((topic) => (
//         <TreeItem
//           key={topic.id}
//           tp={topic}
//           activeId={activeId}
//           onSelect={onSelect}
//           updateTopics={updateTopics}
//           depth={depth}
//         />
//       ))}
//     </ul>
//   );
// }

// function containsId(tp: Topic, id?: string): boolean {
//   return Boolean(
//     id &&
//       (tp.id === id || tp.children.some((child) => containsId(child, id)))
//   );
// }

// function TreeItem({
//   tp,
//   activeId,
//   onSelect,
//   updateTopics,
//   depth,
// }: {
//   tp: Topic;
//   activeId?: string;
//   onSelect: (id: string) => void;
//   updateTopics: (update: (topics: Topic[]) => Topic[]) => void;
//   depth: number;
// }) {
//   const [expanded, setExpanded] = useState(
//     containsId(tp, activeId) || depth === 0
//   );

//   const active = tp.id === activeId;
//   const hasKids = tp.children.length > 0;

//   const addSub = () => {
//     const title = window.prompt(`Subtopic of "${tp.title}"`);

//     if (!title?.trim()) return;

//     const newTopicItem = newTopic(title.trim());

//     updateTopics((topics) =>
//       mapTopic(topics, tp.id, (current) => ({
//         ...current,
//         children: [...current.children, newTopicItem],
//       }))
//     );

//     setExpanded(true);
//     onSelect(newTopicItem.id);
//   };

//   const rename = () => {
//     const title = window.prompt("Rename topic", tp.title);

//     if (title?.trim()) {
//       updateTopics((topics) =>
//         mapTopic(topics, tp.id, (current) => ({
//           ...current,
//           title: title.trim(),
//         }))
//       );
//     }
//   };

//   const del = () => {
//     if (!window.confirm(`Delete "${tp.title}" and its subtopics?`)) return;

//     updateTopics((topics) => removeTopic(topics, tp.id));
//   };

//   return (
//     <li>
//       <div
//         className={`group flex items-center gap-1 rounded-md pr-1 text-sm ${
//           active
//             ? "bg-sidebar-accent text-primary"
//             : "text-sidebar-foreground hover:bg-sidebar-accent/60"
//         }`}
//       >
//         <button
//           onClick={() => setExpanded((current) => !current)}
//           className={`p-1 text-muted-foreground ${
//             hasKids ? "" : "invisible"
//           }`}
//           aria-label="Toggle"
//         >
//           <ChevronRight
//             className={`h-3.5 w-3.5 transition-transform ${
//               expanded ? "rotate-90" : ""
//             }`}
//           />
//         </button>

//         <button
//           onClick={() => onSelect(tp.id)}
//           className="min-w-0 flex-1 truncate py-1.5 text-left"
//         >
//           {tp.title}
//         </button>

//         <span className="flex opacity-60 group-hover:opacity-100">
//           <button
//             onClick={addSub}
//             aria-label="Add subtopic"
//             className="rounded p-1 hover:text-primary"
//           >
//             <Plus className="h-3.5 w-3.5" />
//           </button>

//           <button
//             onClick={rename}
//             aria-label="Rename"
//             className="rounded p-1 hover:text-primary"
//           >
//             <Pencil className="h-3.5 w-3.5" />
//           </button>

//           <button
//             onClick={del}
//             aria-label="Delete"
//             className="rounded p-1 hover:text-destructive"
//           >
//             <Trash2 className="h-3.5 w-3.5" />
//           </button>
//         </span>
//       </div>

//       {hasKids && expanded && (
//         <TopicTree
//           topics={tp.children}
//           activeId={activeId}
//           onSelect={onSelect}
//           updateTopics={updateTopics}
//           depth={depth + 1}
//         />
//       )}
//     </li>
//   );
// }

// // --------------------------------------------------
// // TOPIC CONTENT
// // --------------------------------------------------

// function TopicView({
//   topic,
//   language,
//   update,
// }: {
//   topic: Topic;
//   language: string;
//   update: (update: (topic: Topic) => Topic) => void;
// }) {
//   const [editing, setEditing] = useState<string | null>(null);

//   const setBlocks = (updateBlocks: (blocks: Block[]) => Block[]) =>
//     update((current) => ({
//       ...current,
//       blocks: updateBlocks(current.blocks),
//     }));

//   const add = (type: BlockType, level?: number) => {
//     const block: Block = {
//       id: uid(),
//       type,
//       content: "",
//       lang: type === "code" ? language.toLowerCase() : undefined,
//       level: type === "heading" ? (level ?? 2) : undefined,
//     };

//     setBlocks((blocks) => [...blocks, block]);
//     setEditing(block.id);
//   };

//   return (
//     <article className="max-w-3xl">
//       <p className="font-mono text-xs uppercase tracking-widest text-primary">
//         {language}
//       </p>

//       <h1 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
//         {topic.title}
//       </h1>

//       <div className="mt-8 space-y-5">
//         {topic.blocks.length === 0 && (
//           <p className="text-muted-foreground">
//             No content yet — add a heading, text or code below.
//           </p>
//         )}

//         {topic.blocks.map((block) =>
//           editing === block.id ? (
//             <BlockEditor
//               key={block.id}
//               block={block}
//               onCancel={() => setEditing(null)}
//               onSave={(updatedBlock) => {
//                 setBlocks((blocks) =>
//                   blocks.map((item) =>
//                     item.id === block.id ? updatedBlock : item
//                   )
//                 );
//                 setEditing(null);
//               }}
//             />
//           ) : (
//             <div key={block.id} className="group relative">
//               <BlockView block={block} />

//               <div className="absolute -top-3 right-2 flex gap-1 rounded-md border border-border bg-card p-0.5 opacity-0 shadow transition-opacity group-hover:opacity-100 max-md:opacity-100">
//                 <button
//                   onClick={() => setEditing(block.id)}
//                   aria-label="Edit block"
//                   className="rounded p-1 text-muted-foreground hover:text-primary"
//                 >
//                   <Pencil className="h-3.5 w-3.5" />
//                 </button>

//                 <button
//                   onClick={() =>
//                     window.confirm("Delete this block?") &&
//                     setBlocks((blocks) =>
//                       blocks.filter((item) => item.id !== block.id)
//                     )
//                   }
//                   aria-label="Delete block"
//                   className="rounded p-1 text-muted-foreground hover:text-destructive"
//                 >
//                   <Trash2 className="h-3.5 w-3.5" />
//                 </button>
//               </div>
//             </div>
//           )
//         )}
//       </div>

//       <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
//         {(
//           [
//             ["heading", Heading1, "H1", 1],
//             ["heading", Heading2, "H2", 2],
//             ["heading", Heading3, "H3", 3],
//             ["heading", Heading4, "H4", 4],
//             ["heading", Heading5, "H5", 5],
//             ["heading", Heading6, "H6", 6],
//             ["text", Type, "Text", undefined],
//             ["code", Code2, "Code", undefined],
//           ] as const
//         ).map(([type, Icon, label, level]) => (
//           <button
//             key={label}
//             onClick={() => add(type, level)}
//             className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:border-primary hover:text-primary"
//           >
//             <Icon className="h-4 w-4" />
//             {label}
//           </button>
//         ))}
//       </div>
//     </article>
//   );
// }

// // --------------------------------------------------
// // DISPLAY BLOCKS
// // --------------------------------------------------

// function BlockView({ block }: { block: Block }) {
//   const color = colorValue(block.color);
//   const content = <ColoredText content={block.content || (block.type === "heading" ? "Untitled" : "")} colors={block.colors} />;
//   if (block.type === "heading") {
//     const lvl = block.level ?? 2;
//     if (lvl === 1) return <h1 style={{ color }} className="font-display text-3xl font-bold text-foreground md:text-4xl">{content}</h1>;
//     if (lvl === 3) return <h3 style={{ color }} className="font-display text-lg font-semibold text-foreground">{content}</h3>;
//     return <h2 style={{ color }} className="font-display text-2xl font-semibold text-foreground">{content}</h2>;
//   }
//   if (block.type === "text") return <p style={{ color }} className="whitespace-pre-wrap leading-relaxed text-foreground/85">{content}</p>;
//   return <CodeBlock block={block} />;
// }

// function ColoredText({ content, colors }: { content: string; colors: Block["colors"] }) {
//   return <>{textColorSegments(content, colors ?? []).map((segment, index) => (
//     <span key={index} style={{ color: colorValue(segment.color) }}>{segment.text}</span>
//   ))}</>;
// }

// // -------- CODE BLOCK -------------------
// function CodeBlock({ block }: { block: Block }) {
//   const [code, setCode] = useState(block.content);
//   const [copied, setCopied] = useState(false);
//   const [output, setOutput] = useState<string | null>(null);
//   const [copyError, setCopyError] = useState<string | null>(null);

//   const runnable = ["javascript", "js"].includes(
//     (block.lang || "").toLowerCase()
//   );

//   const copy = async () => {
//     try {
//       await navigator.clipboard.writeText(code);
//       setCopied(true);
//       setCopyError(null);

//       window.setTimeout(() => setCopied(false), 1500);
//     } catch {
//       setCopyError("Unable to copy. Check clipboard permissions.");
//     }
//   };

//   const run = () => {
//     const logs: string[] = [];

//     const format = (value: unknown): string => {
//       if (typeof value === "string") return value;

//       try {
//         return JSON.stringify(value) ?? String(value);
//       } catch {
//         return String(value);
//       }
//     };

//     const fakeConsole = {
//       log: (...values: unknown[]) =>
//         logs.push(values.map(format).join(" ")),
//       error: (...values: unknown[]) =>
//         logs.push("Error: " + values.map(format).join(" ")),
//     };

//     try {
//       // Executes JavaScript locally; use a sandbox for untrusted code.
//       // eslint-disable-next-line no-new-func
//       new Function("console", code)(fakeConsole);
//     } catch (err) {
//       logs.push(
//         "Error: " +
//           (err instanceof Error ? err.message : String(err))
//       );
//     }

//     setOutput(logs.join("\n") || "(no output)");
//   };

//   return (
//     <div className="overflow-hidden rounded-xl border border-border bg-code">
//       <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
//         <span className="font-mono text-xs text-muted-foreground">
//           {block.lang || "code"}
//         </span>

//         <div className="flex gap-1">
//           {runnable && (
//             <button
//               onClick={run}
//               className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-primary hover:bg-secondary"
//             >
//               <Play className="h-3 w-3" />
//               Run
//             </button>
//           )}

//           <button
//             onClick={() => void copy()}
//             className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
//           >
//             {copied ? (
//               <Check className="h-3 w-3 text-primary" />
//             ) : (
//               <Copy className="h-3 w-3" />
//             )}
//             {copied ? "Copied" : "Copy"}
//           </button>
//         </div>
//       </div>

//       <textarea
//         value={code}
//         onChange={(event) => setCode(event.target.value)}
//         spellCheck={false}
//         rows={Math.max(2, code.split("\n").length)}
//         className="block w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-code-foreground outline-none"
//         aria-label="Code example"
//       />

//       {copyError && (
//         <p className="px-3 pb-2 text-xs text-destructive">{copyError}</p>
//       )}

//       {output !== null && (
//         <pre className="whitespace-pre-wrap border-t border-border bg-background/60 p-3 font-mono text-xs text-primary">
//           {output}
//         </pre>
//       )}
//     </div>
//   );
// }

// // -------------- BLOCK EDITOR -----------------
// function BlockEditor({ block, onSave, onCancel }: { block: Block; onSave: (b: Block) => void; onCancel: () => void }) {
//   const [content, setContent] = useState(block.content);
//   const [lang, setLang] = useState(block.lang || "");
//   const [level, setLevel] = useState(block.level ?? 2);
//   const [colors, setColors] = useState(block.colors ?? (block.color ? [{ start: 0, end: block.content.length, color: block.color }] : []));
//   const [selection, setSelection] = useState({ start: 0, end: 0 });
//   const textRef = useRef<HTMLTextAreaElement>(null);
//   const previewRef = useRef<HTMLDivElement>(null);
//   const selected = selection.end > selection.start;
//   const selectedColor = colors.find((range) => range.start <= selection.start && range.end >= selection.end)?.color ?? "";
//   const applyColor = (color: string) => {
//     if (!selected) return;
//     setColors((ranges) => applyTextColor(ranges, selection.start, selection.end, color));
//     textRef.current?.focus();
//     textRef.current?.setSelectionRange(selection.start, selection.end);
//   };
//   return (
//     <div className="space-y-2 rounded-xl border border-primary bg-card p-3">
//       <div className="flex items-center justify-between">
//         <div className="font-mono text-xs uppercase text-primary">{block.type === "heading" ? `heading ${level}` : block.type}</div>
//         {block.type === "heading" && (
//           <div className="flex gap-1">
//             {[1, 2, 3].map((l) => (
//               <button key={l} onClick={() => setLevel(l)}
//                 className={`rounded px-2 py-0.5 font-mono text-xs ${level === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>H{l}</button>
//             ))}
//           </div>
//         )}
//       </div>
//       {block.type !== "code" && (
//         <div className="flex flex-wrap items-center gap-1.5">
//           <span className="font-mono text-xs text-muted-foreground">Color</span>
//           {NOTE_COLORS.map((c) => (
//             <button key={c.key || "default"} type="button" aria-label={c.label} title={selected ? c.label : "Select text first"} disabled={!selected} onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor(c.key)}
//               style={c.value ? { backgroundColor: c.value } : undefined}
//               className={`h-5 w-5 rounded-full border transition-shadow disabled:opacity-40 ${selected && selectedColor === c.key ? "border-foreground ring-2 ring-ring" : "border-border"} ${!c.value ? "bg-background" : ""}`} />
//           ))}
//         </div>
//       )}
//       {block.type === "code" && (
//         <input value={lang} onChange={(e) => setLang(e.target.value)} placeholder="language (e.g. javascript)"
//           className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm text-foreground outline-none" />
//       )}
//       {block.type !== "code" ? (
//         <div className={`note-text-editor relative overflow-hidden rounded-md border border-input bg-background ${block.type === "heading" ? "font-display text-xl" : "text-sm"}`}>
//           <div ref={previewRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3 py-2 text-foreground">
//             <ColoredText content={content} colors={colors} />{"\n"}
//           </div>
//           <textarea ref={textRef} autoFocus aria-label={block.type === "heading" ? "Heading content" : "Text content"} value={content} rows={block.type === "heading" ? 2 : 4}
//             onSelect={(e) => setSelection({ start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })}
//             onScroll={(e) => { if (previewRef.current) previewRef.current.scrollTop = e.currentTarget.scrollTop; }}
//             onChange={(e) => { const value = e.target.value; setColors((ranges) => updateTextColors(ranges, content, value)); setContent(value); }}
//             className="relative block w-full resize-y bg-transparent px-3 py-2 outline-none" />
//         </div>
//       ) : (
//         <textarea autoFocus value={content} onChange={(e) => setContent(e.target.value)} rows={block.type === "code" ? 8 : 4}
//           className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ${block.type === "code" ? "font-mono" : ""}`} />
//       )}
//       <div className="flex justify-end gap-2">
//         <button onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary">Cancel</button>
//         <button onClick={() => onSave({ ...block, content, lang: block.type === "code" ? lang : undefined, level: block.type === "heading" ? level : undefined, color: undefined, colors: block.type === "code" ? undefined : colors })}
//           className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Save</button>
//       </div>
//     </div>
//   );
// }

