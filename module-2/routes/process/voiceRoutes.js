import express from "express";
import { processVoice } from "../../controllers/voiceController.js";

const router = express.Router();

router.post("/voice", processVoice);

export default router;