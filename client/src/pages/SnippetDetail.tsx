import { useParams, Link } from "react-router-dom";
import { mockSnippets } from "@/data/mockSnippets";
import { CodeBlock } from "@/components/CodeBlock2";
import { Button } from "@/components/ui/button";

export default function SnippetDetail() {
  const { id } = useParams();
  const snippet = mockSnippets.find((s) => s._id === id);

  if (!snippet) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Snippet Not Found 😕</h2>
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-4">
      <Link to="/">
        <Button variant="outline">← Back</Button>
      </Link>
      <h1 className="text-3xl font-bold">{snippet.title}</h1>
      <p className="text-muted-foreground">{snippet.description}</p>
      <CodeBlock code={snippet.code} language={snippet.language} />
    </div>
  );
}
