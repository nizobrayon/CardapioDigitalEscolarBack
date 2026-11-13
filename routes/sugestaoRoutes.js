import { Router } from "express";
import {
  create,
  findAll,
  updateStatus,
} from "../controllers/sugestaoController.js";

const router = Router();

router.post("/", create);
router.get("/", findAll);
router.patch("/:id", updateStatus);

export default router;
