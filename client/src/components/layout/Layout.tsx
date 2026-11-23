import { useState } from "react";
import {TopNav} from "./TopNav";
// import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  const [selectedLang, setSelectedLang] = useState("JavaScript");
  const [selectedTopic, setSelectedTopic] = useState("");

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />

      <div className="flex flex-1">
        {/* <Sidebar onSelect={(topic) => setSelectedTopic(topic)} /> */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Pass state or use context later */}
          <Outlet context={{ selectedLang, selectedTopic, setSelectedLang, setSelectedTopic }} />
        </main>
      </div>
    </div>
  );
}
