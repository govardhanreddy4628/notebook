// import { useState } from "react";
// import { Button } from "../ui/button";

// const LANGUAGES = ["JavaScript", "TypeScript", "React"];

// export default function Header({ onSelect }: { onSelect: (lang: string) => void }) {
//   const [active, setActive] = useState("JavaScript");

//   const handleSelect = (lang: string) => {
//     setActive(lang);
//     onSelect(lang);
//   };

//   return (
//     <header className="w-full flex items-center justify-between ">
//       <h1 className="font-bold text-lg">🧠 CodeDocs</h1>
//       <nav className="flex space-x-4 ml-auto">
//         {LANGUAGES.map((lang) => (
//           <Button
//             key={lang}
//             onClick={() => handleSelect(lang)}
//             className={`px-3 py-1 rounded-md transition ${
//               active === lang
//                 ? "bg-blue-600"
//                 : "hover:bg-gray-700"
//             }`}
//           >
//             {lang}
//           </Button>
//         ))}
//       </nav>
//     </header>
//   );
// }




import { Link, NavLink } from "react-router-dom";
//import { useLanguages } from "@/hooks/useLanguages";
import { useLanguageData } from "@/hooks/useLanguages";


export function TopNav() {
  const { languages, loading, error } = useLanguageData();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-11/12 items-center gap-6 px-4 py-3">
        <Link
          to="/"
          className="font-display text-lg font-bold tracking-tight text-foreground"
        >
          note<span className="text-primary">/</span>book
        </Link>

        <nav className="flex gap-1 overflow-x-auto">
          {!loading &&
            !error &&
            languages?.map((language) => (
              <NavLink
                key={language._id}
                to={`/lang/${language._id}`}
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-sm transition-colors hover:bg-secondary hover:text-foreground ${
                    isActive
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground"
                  }`
                }
              >
                {language.name}
              </NavLink>
            ))}
        </nav>
      </div>
    </header>
  );
}
