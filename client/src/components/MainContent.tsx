import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MainContentProps {
  title: string;
  description: string;
  code: string;
}

export function MainContent({ title, description, code }: MainContentProps) {
  return (
    <main className="flex-1 overflow-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="mb-4 text-muted-foreground">{description}</p>
      <SyntaxHighlighter language="tsx" style={oneDark} showLineNumbers>
        {code}
      </SyntaxHighlighter>
    </main>
  );
}
