export const mockSnippets = [
  {
    _id: "1",
    title: "Hello World in JavaScript",
    description: "A simple JavaScript console log example.",
    language: "javascript",
    code: `console.log("Hello, world!");`,
  },
  {
    _id: "2",
    title: "TypeScript Function Example",
    description: "Type-safe function example in TypeScript.",
    language: "typescript",
    code: `function greet(name: string): string {\n  return \`Hello, \${name}\`;\n}`,
  },
  {
    _id: "3",
    title: "React useState Hook Example",
    description: "Basic useState example in React.",
    language: "jsx",
    code: `import { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;\n}`,
  },
];
