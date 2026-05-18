import express from "express";
import { processRequest } from "../controllers/agentController.js";

const router = express.Router();

router.post("/", processRequest);

export default router;