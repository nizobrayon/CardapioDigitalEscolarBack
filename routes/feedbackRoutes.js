import { Router } from "express";
import { create, findAll, remove } from "../controllers/feedbackController.js";

const router = Router();

router.post("/", create);
router.get("/", findAll);
router.delete("/:id", remove);

export default router;
