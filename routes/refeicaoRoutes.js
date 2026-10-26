import express from "express";

import {
    create,
    findAll,
    findById,
    update,
    remove
} from "../controllers/refeicaoController.js";

const router = express.Router();

router.post("/", create);
router.get("/", findAll);
router.get("/:id", findById);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;