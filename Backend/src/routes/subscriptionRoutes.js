import express from "express";

import {
  create,
  listMySubscriptions,
  getOne,
  edit,
  pause,
  resume,
  cancel,
  remove,
  adminListAll,
} from "../controllers/subscriptionController.js";

import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// ─── Admin Routes (must be before :id routes) ────────────────────────────────

router.get("/admin/all", protect, authorize("admin"), adminListAll);

// ─── Resident Routes ──────────────────────────────────────────────────────────

router.post("/", protect, authorize("resident"), create);

router.get("/", protect, authorize("resident"), listMySubscriptions);

router.get("/:id", protect, authorize("resident"), getOne);

router.patch("/:id", protect, authorize("resident"), edit);

router.patch("/:id/pause", protect, authorize("resident"), pause);

router.patch("/:id/resume", protect, authorize("resident"), resume);

router.patch("/:id/cancel", protect, authorize("resident"), cancel);

router.delete("/:id", protect, authorize("resident"), remove);

export default router;
