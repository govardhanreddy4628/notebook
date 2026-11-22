import { Router } from "express";
import { getImageKitAuth } from "../controllers/upload.controller.js";

const router = Router();

router.get("/imagekit-auth", getImageKitAuth);

export default router;