// // Media attachments are stored as blobs in IndexedDB so large files
// // (images, videos, documents) don't blow the localStorage quota used by notes.
// const DB_NAME = "lms-notes-media";
// const STORE = "files";
// let dbPromise: Promise<IDBDatabase> | null = null;

// function openDb(): Promise<IDBDatabase> {
//   if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB unavailable"));
//   if (!dbPromise) {
//     dbPromise = new Promise((resolve, reject) => {
//       const req = indexedDB.open(DB_NAME, 1);
//       req.onupgradeneeded = () => {
//         if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
//       };
//       req.onsuccess = () => resolve(req.result);
//       req.onerror = () => reject(req.error ?? new Error("Failed to open media store"));
//     });
//   }
//   return dbPromise;
// }

// export async function putMedia(id: string, blob: Blob): Promise<void> {
//   const db = await openDb();
//   await new Promise<void>((resolve, reject) => {
//     const tx = db.transaction(STORE, "readwrite");
//     tx.objectStore(STORE).put(blob, id);
//     tx.oncomplete = () => resolve();
//     tx.onerror = () => reject(tx.error);
//   });
// }

// export async function getMedia(id: string): Promise<Blob | undefined> {
//   const db = await openDb();
//   return new Promise((resolve, reject) => {
//     const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
//     req.onsuccess = () => resolve(req.result ?? undefined);
//     req.onerror = () => reject(req.error);
//   });
// }

// export async function deleteMedia(id: string): Promise<void> {
//   try {
//     const db = await openDb();
//     await new Promise<void>((resolve, reject) => {
//       const tx = db.transaction(STORE, "readwrite");
//       tx.objectStore(STORE).delete(id);
//       tx.oncomplete = () => resolve();
//       tx.onerror = () => reject(tx.error);
//     });
//   } catch {
//     /* ignore — missing file is not an error */
//   }
// }

// export async function deleteManyMedia(ids: string[]): Promise<void> {
//   await Promise.all(ids.map((id) => deleteMedia(id)));
// }

// export function formatBytes(n: number): string {
//   if (n < 1024) return `${n} B`;
//   if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
//   return `${(n / (1024 * 1024)).toFixed(1)} MB`;
// }

import { upload } from "@imagekit/javascript";

const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8080";

interface ImageKitAuth {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

export interface MediaUploadResult {
  fileId: string;
  url: string;
  name: string;
  filePath: string;
  size: number;
  mimeType: string;
}

interface UploadMediaOptions {
  folder?: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

// Get temporary upload credentials from our backend.
async function getImageKitAuth(): Promise<ImageKitAuth> {
  const response = await fetch(`${API_BASE_URL}/api/v1/uploads/imagekit-auth`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate ImageKit upload");
  }

  return response.json();
}

// Upload a file directly from the browser to ImageKit.
export async function uploadMedia(
  file: File,
  options: UploadMediaOptions = {},
): Promise<MediaUploadResult> {
  if (!(file instanceof File)) {
    throw new Error("Invalid media file");
  }

  const auth = await getImageKitAuth();

  const result = await upload({
    file,
    fileName: file.name,
    token: auth.token,
    expire: auth.expire,
    signature: auth.signature,
    publicKey: auth.publicKey,

    folder: options.folder || "/lms/media",
    useUniqueFileName: true,

    onProgress: (event) => {
      if (event.total > 0) {
        const progress = Math.round((event.loaded / event.total) * 100);

        options.onProgress?.(progress);
      }
    },

    ...(options.signal ? { abortSignal: options.signal } : {}),
  });

  if (
  !result.fileId ||
  !result.url ||
  !result.name ||
  !result.filePath ||
  !result.fileType ||
  result.size === undefined
) {
  throw new Error("ImageKit upload returned incomplete file information");
}

return {
  fileId: result.fileId,
  url: result.url,
  name: result.name,
  filePath: result.filePath,
  size: result.size,
  mimeType: file.type,
};
}

// Delete one uploaded file through our backend.
export async function deleteMedia(fileId: string): Promise<void> {
  if (!fileId) return;

  const response = await fetch(
    `${API_BASE_URL}/api/v1/uploads/${encodeURIComponent(fileId)}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to delete media");
  }
}

// Delete multiple uploaded files.
export async function deleteManyMedia(fileIds: string[]): Promise<void> {
  await Promise.all(fileIds.map(deleteMedia));
}

// Format file size.
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;

  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }

  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
