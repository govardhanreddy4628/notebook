import express from "express";
import cors from "cors";

import languageRoutes from "./routes/language.routes.js";
import topicRoutes from "./routes/topic.routes.js";
import blockRoutes from "./routes/block.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to CodeNest API",
    health: "/health",
    endpoints: {
      languages: "/api/v1/languages",
      topics: "/api/v1/topics",
      blocks: "/api/v1/blocks",
      uploads: "/api/v1/uploads",
    },
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

app.use("/api/v1/languages", languageRoutes);
app.use("/api/v1/topics", topicRoutes);
app.use("/api/v1/blocks", blockRoutes);
app.use("/api/v1/uploads", uploadRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Register after your routes.
app.use(errorMiddleware);

export default app;