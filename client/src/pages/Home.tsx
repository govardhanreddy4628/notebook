// import { useOutletContext } from "react-router-dom";
// import { CodeBlock } from "@/components/CodeBlock";
// import { mockSnippets } from "@/data/mockSnippets";
// import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

// interface OutletContext {
//   selectedLang: string;
//   selectedTopic: string;
// }

// export default function Home() {
//   const { selectedLang, selectedTopic } = useOutletContext<OutletContext>();

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">
//         {selectedLang} Snippets {selectedTopic && `– ${selectedTopic}`}
//       </h1>

//       {mockSnippets
//         .filter((s) => s.language.toLowerCase().includes(selectedLang.toLowerCase()))
//         .map((snip) => (
//           <Card key={snip._id}>
//             <CardHeader>
//               <CardTitle>{snip.title}</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="mb-2 text-muted-foreground">{snip.description}</p>
//               <CodeBlock code={snip.code} language={snip.language} />
//             </CardContent>
//           </Card>
//         ))}
//     </div>
//   );
// }




import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Trash2, ArrowRight } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Language } from "@/types";
import { useLanguageData } from "@/hooks/useLanguages";
import AddLanguage from "@/components/AddLanguage";
import { LANGUAGES_API, TOPICS_API } from "@/lib/api";

//import { createLanguage, deleteLanguage } from "@/lib/api";

// function countTopics(ts: { children: { children: Topic[] }[] }[]): number {
//   return ts.reduce((n, t) => n + 1 + countTopics(t.children), 0);
// }

function extractTopics(response: unknown): unknown[] {
  if (Array.isArray(response)) {return response}

  if (typeof response !== "object" ||response === null) {
    throw new Error("Invalid topics API response.");
  }

  const data = (response as Record<string, unknown>)["data"];

  if (Array.isArray(data)) {return data}

  const topics = (response as Record<string, unknown>)["topics"];

  if (Array.isArray(topics)) {return topics}

  if (typeof data === "object" && data !== null) {
    const nestedTopics = (
      data as Record<string, unknown>
    )["topics"];

    if (Array.isArray(nestedTopics)) {
      return nestedTopics;
    }
  }

  throw new Error("Could not extract topics from the API response.");
}

export default function Index() {
  const { languages, loading, error } = useLanguageData();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [topicCounts, setTopicCounts] = useState<Record<string, number | null>>({});

  const createLanguage = async (language: { name: string }) => {
    const response = await fetch(LANGUAGES_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(language),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        body?.message || "Failed to create language.",
      );
    }
    alert(`Language ${language.name} created successfully.`);

    return body;
  };

  const deleteLanguage = async (id: string) => {
    const response = await fetch(
      `${LANGUAGES_API}/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        body?.message || "Failed to delete language.",
      );
    }

    return body;
  };


  const add = async () => {
    const n = name.trim();

    if (!n || saving) return;

    const alreadyExists = languages.some(
      (language: Language) =>
        language.name.trim().toLowerCase() === n.toLowerCase(),
    );

    if (alreadyExists) {
      alert("This language already exists.");
      return;
    }

    try {
      setSaving(true);

      await createLanguage({ name: n });

      setName("");

      window.location.reload();
    } catch (err) {
      console.error("Failed to add language:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to add language.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, languageName: string) => {
    const confirmed = window.confirm(
      `Delete ${languageName} and all its notes?`,
    );

    if (!confirmed) return;

    try {
      await deleteLanguage(id);

      window.location.reload();
    } catch (err) {
      console.error("Failed to delete language:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete language.",
      );
    }
  };

  useEffect(() => {
    if (loading) return;

    if (languages.length === 0) {
      setTopicCounts({});
      return;
    }

    let cancelled = false;

    async function fetchTopicCounts() {
      const entries = await Promise.all(
        languages.map(async (language) => {
          try {
            const response = await fetch(
              `${TOPICS_API}/language/${encodeURIComponent(language._id)}`,
            );

            if (!response.ok) {
              throw new Error(
                `Failed to load topics for ${language.name}`,
              );
            }

            const body: unknown = await response.json();
            const topics = extractTopics(body);
            return [language._id, topics.length] as const;
          } catch (err) {
            console.error(
              `Failed to load topic count for ${language.name}:`,
              err,
            );

            return [language._id, null] as const;
          }
        }),
      );

      if (cancelled) return;

      setTopicCounts(Object.fromEntries(entries));
    }

    void fetchTopicCounts();

    return () => {
      cancelled = true;
    };
  }, [languages, loading]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto max-w-7xl px-4 py-14">
        <p className="font-mono text-sm text-primary">
          // your learning notebook
        </p>

        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
          Write it down. <span className="text-primary">Run it.</span> Remember it.
        </h1>

        <p className="mt-4 max-w-xl text-muted-foreground">
          Pick a language to browse topics and subtopics, or add your own and start taking notes.
        </p>

        {loading && <p className="mt-6">Loading languages...</p>}

        {error && (
          <p className="mt-6 text-destructive">
            Failed to load languages. Please try again.
          </p>
        )}

        {!loading && !error && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {languages?.map((l: Language) => (
              <div
                key={l._id}
                className="group relative rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <Link to={`/lang/${l._id}`} className="block">
                  <div className="font-display text-2xl font-semibold text-card-foreground">
                    {l.name}
                  </div>

                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {topicCounts[l._id] === undefined
                      ? "Loading topics..."
                      : topicCounts[l._id] === null
                        ? "Topics unavailable"
                        : `${topicCounts[l._id]} ${topicCounts[l._id] === 1 ? "topic" : "topics"
                        }`}
                  </div>

                  <ArrowRight className="mt-6 h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
                </Link>

                <button
                  type="button"
                  aria-label={`Delete ${l.name}`}
                  onClick={() => remove(l._id, l.name)}
                  className="absolute right-3 top-3 rounded p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <AddLanguage name={name} setName={setName} saving={saving} add={add} />
          </div>
        )}
      </main>
    </div>
  );
}
