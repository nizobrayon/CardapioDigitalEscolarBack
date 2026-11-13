import { Router } from "express";
import { create, findAll } from "../controllers/feedbackController.js";

const router = Router();

router.post("/", create);
router.get("/", findAll);

export default router;
