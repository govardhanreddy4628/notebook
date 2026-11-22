// ------------------- API CONFIGURATION ------------------------
const API_BASE_URL = (
  import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8080"
).replace(/\/+$/, "");


export const LANGUAGES_API = `${API_BASE_URL}/api/v1/languages`;
export const TOPICS_API = `${API_BASE_URL}/api/v1/topics`;
export const BLOCKS_API = `${API_BASE_URL}/api/v1/blocks`;
export const IMAGEKIT_AUTH_API =`${API_BASE_URL}/api/v1/uploads/imagekit-auth`;