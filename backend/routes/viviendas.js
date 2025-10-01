import express from "express";
import {
  getViviendas,
  getViviendaById,
  createVivienda,
  updateVivienda,
  deleteVivienda
} from "../controllers/viviendaController.js";

const router = express.Router();

// CRUD endpoints
router.get("/", getViviendas);
router.get("/:id", getViviendaById);
router.post("/", createVivienda);
router.put("/:id", updateVivienda);
router.delete("/:id", deleteVivienda);

export default router;