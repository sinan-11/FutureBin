import express from "express";

import {
  getAllSettings,
  updateSingleSetting,
  bulkUpdateSettings,
} from "../controllers/settingController.js";

import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/", getAllSettings);

router.put("/bulk", bulkUpdateSettings);

router.put("/:key", updateSingleSetting);

export default router;
