import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import SnippetDetail from "@/pages/SnippetDetail";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/layout/Layout";
//import "./App.css"
//import LangPage from "./routes/lang.$lang";
import LangPage from "@/pages/langPage";

export default function App() {
  return (
    <Routes>
      {/* <Route element={<Layout />}> */}
        <Route path="/" element={<Home />} />
        <Route path="/snippet/:id" element={<SnippetDetail />} />
        <Route path="/lang/:lang" element={<LangPage />} />
      {/* </Route> */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
