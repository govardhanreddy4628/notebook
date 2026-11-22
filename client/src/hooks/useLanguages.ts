import { useEffect, useState} from "react";
import {  type Language } from "@/types.ts";

// ------------------- API CONFIGURATION ------------------------
const API_BASE_URL = (
  import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8080"
).replace(/\/+$/, "");

console.log("API_BASE_URL:", API_BASE_URL);
const LANGUAGES_API = `${API_BASE_URL}/api/v1/languages`;

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.message ||
        body?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return body as T;
}

function extractLanguages(body: unknown): Language[] {
  if (Array.isArray(body)) {
    return body as Language[];
  }

  if (body && typeof body === "object") {
    const result = body as Record<string, unknown>;

    if (Array.isArray(result["languages"])) {
      return result["languages"] as Language[];
    }

    if (Array.isArray(result["data"])) {
      return result["data"] as Language[];
    }

    const data = result["data"];

    if (data && typeof data === "object") {
      const nestedData = data as Record<string, unknown>;

      if (Array.isArray(nestedData["languages"])) {
        return nestedData["languages"] as Language[];
      }
    }
  }

  throw new Error(
    "Invalid languages API response. Expected an array of languages.",
  );
}

async function fetchLanguages(): Promise<Language[]> {
  const response = await fetch(LANGUAGES_API);

  const body = await readResponse<unknown>(response);

  return extractLanguages(body);
}


// --------------------------------------------------
// LOAD LANGUAGES FROM THE BACKEND
// --------------------------------------------------

export function useLanguageData() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchLanguages();

        if (!cancelled) {
          setLanguages(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load languages."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    languages,
    setLanguages,
    loading,
    error,
    setError,
  };
}