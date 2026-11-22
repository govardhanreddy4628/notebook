// import { Router } from "express";

// import {
//   getLanguages,
//   getLanguageById,
//   createLanguage,
//   updateLanguage,
//   deleteLanguage,
// } from "../controllers/language.controller.js";

// const router = Router();

// router.get("/", getLanguages);
// router.get("/:id", getLanguageById);
// router.post("/", createLanguage);
// router.put("/:id", updateLanguage);
// router.delete("/:id", deleteLanguage);

// export default router;





import { Router } from "express";

import {
  createLanguage,
  getLanguages,
  getLanguage,
  updateLanguage,
  deleteLanguage,
} from "../controllers/language.controller.js";

const router = Router();

router.route("/")
  .post(createLanguage)
  .get(getLanguages);

router.route("/:languageId")
  .get(getLanguage)
  .patch(updateLanguage)
  .delete(deleteLanguage);

export default router;