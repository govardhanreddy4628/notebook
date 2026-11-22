import { CodeBlock } from "./codeBlock";

function ColoredText({ content, colors }: { content: string; colors: Block["colors"] }) {
  return <>{textColorSegments(content, colors ?? []).map((segment, index) => (
    <span key={index} style={{ color: colorValue(segment.color) }}>{segment.text}</span>
  ))}</>;
}

export function BlockView({ block }: { block: Block }) {
  const color = colorValue(block.color);
  const content = <ColoredText content={block.content || (block.type === "heading" ? "Untitled" : "")} colors={block.colors} />;
  if (block.type === "heading") {
    const lvl = block.level ?? 2;
    if (lvl === 1) return <h1 style={{ color }} className="font-display text-3xl font-bold text-foreground md:text-4xl">{content}</h1>;
    if (lvl === 3) return <h3 style={{ color }} className="font-display text-lg font-semibold text-foreground">{content}</h3>;
    return <h2 style={{ color }} className="font-display text-2xl font-semibold text-foreground">{content}</h2>;
  }
  if (block.type === "text") return <p style={{ color }} className="whitespace-pre-wrap leading-relaxed text-foreground/85">{content}</p>;
  return <CodeBlock block={block} />;
}