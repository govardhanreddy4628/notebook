// import { useCallback, useEffect, useState} from "react";
// import {  type Topic } from "@/types.ts";
// import { useParams } from "react-router-dom";
// import { useLanguageData } from "./useLanguages";

// // ------------------- API CONFIGURATION ------------------------
// const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8080").replace(/\/$/, "");
// const TOPICS_API = `${API_BASE_URL}/api/v1/topics`;

// // MongoDB normally returns _id.
// // Normalize it to id for the frontend Topic type.
// type ApiTopic = Omit<Topic, "id" | "language" | "parentTopic"> & {
//   _id?: string;
//   id?: string;
//   language: string | { _id: string };
//   parentTopic: string | { _id: string } | null;
// };

// async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
//   const response = await fetch(url, {
//     ...options,
//     credentials: "include",
//     headers: {
//       "Content-Type": "application/json",
//       ...options.headers,
//     },
//   });

//   if (!response.ok) {
//     const body = await response.json().catch(() => null);

//     throw new Error(
//       body?.message ||
//         body?.error ||
//         `Request failed (${response.status})`,
//     );
//   }

//   if (response.status === 204) {
//     return undefined as T;
//   }

//   return response.json() as Promise<T>;
// }

// export function useTopicsData() {
//   const { lang } = useParams<{ lang: string }>();
//   const { languages } = useLanguageData();

//   const language = languages.find((item) => item._id === lang);

//   const [topics, setTopics] = useState<Topic[]>([]);
//   const [topicsLoading, setTopicsLoading] = useState(false);
//   const [topicsError, setTopicsError] = useState<string | null>(null);
 

//   // Handles either a direct array or a common { data: [...] } response.
//   function extractArray<T>(response: unknown): T[] {
//     if (Array.isArray(response)) {
//       return response as T[];
//     }
  
//     if (
//       response &&
//       typeof response === "object" &&
//       "data" in response &&
//       Array.isArray(response.data)
//     ) {
//       return response.data as T[];
//     }
  
//     return [];
//   }
  
//   function normalizeTopic(topic: ApiTopic): Topic {
//     const languageId =
//       typeof topic.language === "string"
//         ? topic.language
//         : topic.language._id;
  
//     const parentTopicId =
//       topic.parentTopic === null
//         ? null
//         : typeof topic.parentTopic === "string"
//           ? topic.parentTopic
//           : topic.parentTopic._id;
  
//     return {
//       ...topic,
//       id: topic._id ?? topic.id ?? "",
//       language: languageId,
//       parentTopic: parentTopicId,
//     };
//   }

//   const loadTopics = useCallback(async () => {
//     if (!language?._id) return;

//     setTopicsLoading(true);
//     setTopicsError(null);

//     try {
//       const response = await apiRequest<unknown>(
//         `${TOPICS_API}?language=${encodeURIComponent(language._id)}`,
//       );

//       const items = extractArray<ApiTopic>(response)
//         .map(normalizeTopic)
//         .filter((topic) => topic.id);

//       setTopics(items);
//     } catch (error) {
//       setTopicsError(
//         error instanceof Error ? error.message : "Could not load topics.",
//       );
//     } finally {
//       setTopicsLoading(false);
//     }
//   }, [language?._id]);

 

//   useEffect(() => {
//     let cancelled = false;

//     async function load() {
//       try {
        

//         const result = await loadTopics();

//         if (!cancelled) {
//           setTopics(result);
//         }
//       } catch (err) {
//         if (!cancelled) {
//           setTopicsError(
//             err instanceof Error
//               ? err.message
//               : "Failed to load topics."
//           );
//         }
//       } finally {
//         if (!cancelled) {
//           setTopicsLoading(false);
//         }
//       }
//     }

//     void load();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   return {
//     topics,
//     setTopics,
//     topicsLoading,
//     topicsError,
//     setTopicsError,
//   };
// }








import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Topic } from "@/types";
import { useLanguageData } from "./useLanguages";
import { TOPICS_API } from "@/lib/api";


// ------------------- API TYPES ------------------------
type ApiReference = string | { _id?: string; id?: string };

type ApiTopic = Omit<Topic, "id" | "language" | "parentTopic"> & {
  _id?: string;
  id?: string;
  language: ApiReference;
  parentTopic: ApiReference | null;
};

// ------------------- API HELPERS ------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);

    const message =
      isRecord(body) && typeof body["message"] === "string"
        ? body["message"]
        : isRecord(body) && typeof body["error"] === "string"
          ? body["error"]
          : `Request failed (${response.status})`;

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// Supports:
// [topic, topic]
// { data: [topic, topic] }
// { topics: [topic, topic] }
// { data: { topics: [topic, topic] } }

function extractTopics(response: unknown): ApiTopic[] {
  if (Array.isArray(response)) {
    return response as ApiTopic[];
  }

  if (!isRecord(response)) {
    throw new Error("Invalid topics API response.");
  }

  const data = response["data"];

  if (Array.isArray(data)) {
    return data as ApiTopic[];
  }

  const topics = response["topics"];

  if (Array.isArray(topics)) {
    return topics as ApiTopic[];
  }

  if (isRecord(data)) {
    const nestedTopics = data["topics"];

    if (Array.isArray(nestedTopics)) {
      return nestedTopics as ApiTopic[];
    }
  }

  throw new Error(
    "Invalid topics API response. Expected an array of topics.",
  );
}

function getReferenceId(reference: ApiReference): string {
  if (typeof reference === "string") {
    return reference;
  }

  return reference._id ?? reference.id ?? "";
}

function normalizeTopic(topic: ApiTopic): Topic {
  return {
    ...topic,
    id: topic._id ?? topic.id ?? "",
    language: getReferenceId(topic.language),
    parentTopic:
      topic.parentTopic === null
        ? null
        : getReferenceId(topic.parentTopic),
  };
}

// ------------------- useTopicsData HOOK ------------------------

export function useTopicsData() {
  const { lang } = useParams<{ lang: string }>();
  const { languages } = useLanguageData();

  const language = languages.find((item) => item._id === lang);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const languageId = language?._id;

  const loadTopics = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      if (!languageId) {
        setTopics([]);
        setTopicsLoading(false);
        setTopicsError(null);
        return;
      }

      setTopicsLoading(true);
      setTopicsError(null);

      try {
        const response = await apiRequest<unknown>(
          `${TOPICS_API}/language/${encodeURIComponent(languageId)}/all`,
          signal ? { signal } : {},
        );

        // Ignore results if this request has been cancelled.
        if (signal?.aborted) return;

        const items = extractTopics(response)
          .map(normalizeTopic)
          .filter((topic) => topic.id.length > 0);

        setTopics(items);
      } catch (error: unknown) {
        if (signal?.aborted) return;

        setTopicsError(
          error instanceof Error
            ? error.message
            : "Could not load topics.",
        );
      } finally {
        if (!signal?.aborted) {
          setTopicsLoading(false);
        }
      }
    },
    [languageId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadTopics(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadTopics]);

  return {
    topics,
    setTopics,
    topicsLoading,
    topicsError,
    setTopicsError,
    loadTopics,
  };
}
