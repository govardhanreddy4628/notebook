
export type BlockType = "heading" | "text" | "code";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  lang?: string;
}

export interface Topic {
  id: string;
  title: string;
  blocks: Block[];
  children: Topic[];
}

export interface Language {
  id: string;
  name: string;
  topics: Topic[];
}

// Helper functions for creating blocks and topics
const h = (id: string, content: string): Block => ({
  id,
  type: "heading",
  content,
});

const p = (id: string, content: string): Block => ({id, type: "text", content});

const c = (id: string, content: string, lang: string): Block => ({
  id,
  type: "code",
  content,
  lang,
});

const t = (
  id: string,
  title: string,
  blocks: Block[] = [],
  children: Topic[] = [],
): Topic => ({
  id,
  title,
  blocks,
  children,
});

export const seedLanguages: Language[] = [
  // ==========================================
  // JAVASCRIPT
  // ==========================================
  {
    id: "javascript",
    name: "JavaScript",
    topics: [
      t("js-introduction", "Introduction", [
        h("js-intro-heading", "What is JavaScript?"),
        p(
          "js-intro-text",
          "JavaScript is a programming language used to make websites interactive. It can run in browsers and on servers using Node.js.",
        ),
        c(
          "js-intro-example",
          'console.log("Hello, World!");',
          "javascript",
        ),
      ]),

      t(
        "js-variables",
        "Variables",
        [
          h("js-vars-heading", "Declaring variables"),
          p(
            "js-vars-text",
            "Use let for values that can change and const for bindings that should not be reassigned. Avoid var in modern JavaScript unless you specifically need its function-scoped behavior.",
          ),
          c(
            "js-vars-example",
            'let age = 25;\nconst name = "Alex";\n\nage = 26;\nconsole.log(name);\nconsole.log(age);',
            "javascript",
          ),
        ],
        [
          t("js-let-vs-const", "let vs const", [
            h("js-let-const-heading", "Difference between let and const"),
            p(
              "js-let-const-text",
              "let allows reassignment. const does not allow reassignment, but objects and arrays declared with const can still have their contents modified.",
            ),
            c(
              "js-let-const-example",
              'let score = 10;\nscore = 20;\n\nconst colors = ["red", "blue"];\ncolors.push("green");\n\nconsole.log(score); // 20\nconsole.log(colors);',
              "javascript",
            ),
          ]),

          t("js-data-types", "Data Types", [
            h("js-types-heading", "JavaScript data types"),
            p(
              "js-types-text",
              "JavaScript has primitive types such as string, number, boolean, undefined, null, bigint, and symbol. Objects, including arrays and functions, are non-primitive values.",
            ),
            c(
              "js-types-example",
              'const name = "Alex";\nconst age = 25;\nconst isStudent = true;\nconst result = undefined;\nconst emptyValue = null;\nconst numbers = [1, 2, 3];\n\nconsole.log(typeof name); // "string"\nconsole.log(typeof age); // "number"\nconsole.log(typeof numbers); // "object"',
              "javascript",
            ),
          ]),
        ],
      ),

      t("js-functions", "Functions", [
        h("js-functions-heading", "Creating functions"),
        p(
          "js-functions-text",
          "Functions are reusable blocks of code. They can accept parameters and return results.",
        ),
        c(
          "js-functions-example",
          'function add(a, b) {\n  return a + b;\n}\n\nconst multiply = (a, b) => a * b;\n\nconsole.log(add(2, 3));\nconsole.log(multiply(4, 5));',
          "javascript",
        ),
      ]),
    ],
  },

  // ==========================================
  // HTML
  // ==========================================
  {
    id: "html",
    name: "HTML",
    topics: [
      t("html-introduction", "Introduction", [
        h("html-intro-heading", "What is HTML?"),
        p(
          "html-intro-text",
          "HTML stands for HyperText Markup Language. It defines the structure and content of web pages using elements and tags.",
        ),
        c(
          "html-intro-example",
          '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Hello, World!</h1>\n    <p>My first web page.</p>\n  </body>\n</html>',
          "html",
        ),
      ]),

      t(
        "html-forms",
        "Forms",
        [
          h("html-forms-heading", "Creating a form"),
          p(
            "html-forms-text",
            "Forms collect user input. The action attribute specifies where data is submitted, and the method specifies how it is sent.",
          ),
          c(
            "html-forms-example",
            '<form action="/submit" method="post">\n  <label for="username">Username</label>\n  <input\n    id="username"\n    name="username"\n    type="text"\n    required\n  />\n\n  <button type="submit">Submit</button>\n</form>',
            "html",
          ),
        ],
        [
          t("html-input-types", "Input types", [
            h("html-input-types-heading", "Common input types"),
            p(
              "html-input-types-text",
              "The type attribute controls what kind of input a user can enter. Common types include text, email, password, number, date, checkbox, and radio.",
            ),
            c(
              "html-input-types-example",
              '<input type="text" placeholder="Name" />\n<input type="email" placeholder="Email" />\n<input type="password" placeholder="Password" />\n<input type="number" min="1" max="100" />\n<input type="date" />\n<label>\n  <input type="checkbox" /> Accept terms\n</label>',
              "html",
            ),
          ]),
        ],
      ),
    ],
  },

  // ==========================================
  // PYTHON
  // ==========================================
  {
    id: "python",
    name: "Python",
    topics: [
      t("python-introduction", "Introduction", [
        h("python-intro-heading", "What is Python?"),
        p(
          "python-intro-text",
          "Python is a high-level programming language known for its readable syntax. It is used in web development, automation, data analysis, and artificial intelligence.",
        ),
        c(
          "python-intro-example",
          'print("Hello, World!")\n\nname = input("Enter your name: ")\nprint("Hello,", name)',
          "python",
        ),
      ]),

      t(
        "python-lists",
        "Lists",
        [
          h("python-lists-heading", "Creating and using lists"),
          p(
            "python-lists-text",
            "Lists store multiple items in an ordered, mutable collection. Indexing starts at zero.",
          ),
          c(
            "python-lists-example",
            'numbers = [10, 20, 30, 40]\n\nprint(numbers[0])  # 10\nnumbers.append(50)\nnumbers[1] = 25\n\nprint(numbers)',
            "python",
          ),
        ],
        [
          t("python-list-comprehensions", "List comprehensions", [
            h(
              "python-comprehensions-heading",
              "Creating lists with comprehensions",
            ),
            p(
              "python-comprehensions-text",
              "A list comprehension creates a new list using an expression and an iterable. An optional condition filters the values.",
            ),
            c(
              "python-comprehensions-example",
              'numbers = [1, 2, 3, 4, 5]\n\nsquares = [n * n for n in numbers]\nevens = [n for n in numbers if n % 2 == 0]\n\nprint(squares)\nprint(evens)',
              "python",
            ),
          ]),
        ],
      ),
    ],
  },

  // ==========================================
  // JAVA
  // ==========================================
  {
    id: "java",
    name: "Java",
    topics: [
      t("java-introduction", "Introduction", [
        h("java-intro-heading", "What is Java?"),
        p(
          "java-intro-text",
          "Java is a strongly typed, class-based programming language. Java programs are commonly compiled into bytecode that runs on the Java Virtual Machine (JVM).",
        ),
        c(
          "java-intro-example",
          'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
          "java",
        ),
      ]),

      t("java-classes", "Classes", [
        h("java-classes-heading", "Creating a class"),
        p(
          "java-classes-text",
          "A class defines a type that can contain fields and methods. An object is an instance of a class.",
        ),
        c(
          "java-classes-example",
          'class Person {\n    String name;\n    int age;\n\n    Person(String name, int age) {\n        this.name = name;\n        this.age = age;\n    }\n\n    void introduce() {\n        System.out.println("My name is " + name);\n        System.out.println("I am " + age + " years old");\n    }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Person person = new Person("Alex", 25);\n        person.introduce();\n    }\n}',
          "java",
        ),
      ]),
    ],
  },
];
