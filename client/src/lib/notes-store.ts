// import { useEffect, useSyncExternalStore } from "react";
// import { type Block, type Topic, type Language } from "../types.ts";


// export const uid = () => Math.random().toString(36).slice(2, 10);

// const t = (title: string, blocks: Block[] = [], children: Topic[] = []): Topic => ({
//   id: uid(),
//   title,
//   blocks,
//   children,
// });
// const h = (content: string): Block => ({ id: uid(), type: "heading", content });
// const p = (content: string): Block => ({ id: uid(), type: "text", content });
// const c = (content: string, lang: string): Block => ({ id: uid(), type: "code", content, lang });

// const seed: Language[] = [
//   {
//     id: "javascript",
//     name: "JavaScript",
//     topics: [
//       t("Introduction", [h("What is JavaScript?"), p("JavaScript is the programming language of the web. It runs in every browser and on servers via Node.js."), c('console.log("Hello, world!");', "javascript")]),
//       t("Variables", [p("Declare variables with let, const or var."), c("const name = 'Ada';\nlet age = 36;\nconsole.log(name, age);", "javascript")], [
//         t("let vs const", [p("Use const by default; use let when the value changes."), c("let count = 0;\ncount++;\nconsole.log(count);", "javascript")]),
//         t("Data types", [p("Primitive types: string, number, boolean, null, undefined, bigint, symbol."), c("console.log(typeof 42, typeof 'hi', typeof true);", "javascript")]),
//       ]),
//       t("Functions", [h("Arrow functions"), c("const add = (a, b) => a + b;\nconsole.log(add(2, 3));", "javascript")]),
//     ],
//   },
//   {
//     id: "html",
//     name: "HTML",
//     topics: [
//       t("Introduction", [p("HTML describes the structure of a web page using elements."), c("<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>", "html")]),
//       t("Forms", [p("Forms collect user input."), c('<form>\n  <input type="text" name="q" />\n  <button>Send</button>\n</form>', "html")], [
//         t("Input types", [c('<input type="email" />\n<input type="date" />', "html")]),
//       ]),
//     ],
//   },
//   {
//     id: "python",
//     name: "Python",
//     topics: [
//       t("Introduction", [p("Python is a readable, general‑purpose language."), c('print("Hello, world!")', "python")]),
//       t("Lists", [c("nums = [1, 2, 3]\nnums.append(4)\nprint(nums)", "python")], [
//         t("List comprehensions", [c("squares = [n * n for n in range(5)]", "python")]),
//       ]),
//     ],
//   },
//   {
//     id: "java",
//     name: "Java",
//     topics: [
//       t("Introduction", [p("Java is a statically typed, object‑oriented language."), c('public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello");\n  }\n}', "java")]),
//       t("Classes", [p("Everything in Java lives inside a class.")]),
//     ],
//   },
// ];

// const KEY = "lms-notes-v1";
// let state: Language[] = seed;
// let hydrated = false;
// const listeners = new Set<() => void>();

// function emit() {
//   if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
//   listeners.forEach((l) => l());
// }

// export function setLanguages(fn: (s: Language[]) => Language[]) {
//   state = fn(state);
//   emit();
// }

// function hydrate() {
//   if (hydrated) return;
//   hydrated = true;
//   try {
//     const raw = localStorage.getItem(KEY);
//     if (raw) {
//       state = JSON.parse(raw);
//       listeners.forEach((l) => l());
//     }
//   } catch {
//     /* ignore */
//   }
// }

// export function useLanguages() {
//   useEffect(hydrate, []);
//   return useSyncExternalStore(
//     (l) => {
//       listeners.add(l);
//       return () => listeners.delete(l);
//     },
//     () => state,
//     () => seed,
//   );
// }

// // Tree helpers
// export function findTopic(topics: Topic[], id: string): Topic | undefined {
//   for (const tp of topics) {
//     if (tp.id === id) return tp;
//     const f = findTopic(tp.children, id);
//     if (f) return f;
//   }
//   return undefined;
// }

// export function mapTopic(topics: Topic[], id: string, fn: (t: Topic) => Topic): Topic[] {
//   return topics.map((tp) =>
//     tp.id === id ? fn(tp) : { ...tp, children: mapTopic(tp.children, id, fn) },
//   );
// }

// export function removeTopic(topics: Topic[], id: string): Topic[] {
//   return topics
//     .filter((tp) => tp.id !== id)
//     .map((tp) => ({ ...tp, children: removeTopic(tp.children, id) }));
// }

// export function newTopic(title: string): Topic {
//   return { id: uid(), title, blocks: [], children: [] };
// }

// export function slugify(s: string) {
//   return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || uid();
// }
