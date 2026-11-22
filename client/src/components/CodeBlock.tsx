import { useState } from "react";
import { Copy, Check, Play } from "lucide-react";
import {
  type Block
} from "@/types";


export function CodeBlock({ block }: { block: Block }) {
  //const [code, setCode] = useState(block.code || "");
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const code = block.code ?? "";

  const runnable = ["javascript", "js"].includes(
    (block.language || "").toLowerCase()
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyError(null);

      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError("Unable to copy. Check clipboard permissions.");
    }
  };

  const run = () => {
    const logs: string[] = [];

    const format = (value: unknown): string => {
      if (typeof value === "string") return value;

      try {
        return JSON.stringify(value) ?? String(value);
      } catch {
        return String(value);
      }
    };

    const fakeConsole = {
      log: (...values: unknown[]) =>
        logs.push(values.map(format).join(" ")),
      error: (...values: unknown[]) =>
        logs.push("Error: " + values.map(format).join(" ")),
    };

    try {
      // Executes JavaScript locally; use a sandbox for untrusted code.
      // eslint-disable-next-line no-new-func
      new Function("console", code)(fakeConsole);
    } catch (err) {
      logs.push(
        "Error: " +
        (err instanceof Error ? err.message : String(err))
      );
    }

    setOutput(logs.join("\n") || "(no output)");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-code">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">
          {block.language || "code"}
        </span>

        <div className="flex gap-1">
          {runnable && (
            <button
              onClick={run}
              className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-primary hover:bg-secondary"
            >
              <Play className="h-3 w-3" />
              Run
            </button>
          )}

          <button
            onClick={() => void copy()}
            className="inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        spellCheck={false}
        rows={Math.max(2, code.split("\n").length)}
        className="block w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-code-foreground outline-none"
        aria-label="Code example"
      /> */}

      <pre className="w-full overflow-x-auto whitespace-pre p-4 font-mono text-sm leading-relaxed text-code-foreground">
        <code>{code}</code>
      </pre>

      {copyError && (
        <p className="px-3 pb-2 text-xs text-destructive">{copyError}</p>
      )}

      {output !== null && (
        <pre className="whitespace-pre-wrap border-t border-border bg-background/60 p-3 font-mono text-xs text-primary">
          {output}
        </pre>
      )}
    </div>
  );
}