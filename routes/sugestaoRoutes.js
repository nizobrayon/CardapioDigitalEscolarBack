import { Router } from "express";
import {
  create,
  findAll,
  updateStatus,
  remove,
} from "../controllers/sugestaoController.js";

const router = Router();

router.post("/", create);
router.get("/", findAll);
router.patch("/:id", updateStatus);
router.delete("/:id", remove);

export default router;
