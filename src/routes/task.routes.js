import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  createNewTask,
  getAllTasks,
  getTodayTaskCount,
  getTodayTasks,
  updateTaskCompletion
} from "../controller/task.controller.js";

const router = Router();

router.post("/", authenticateToken, createNewTask);

router.get("/", authenticateToken, getAllTasks);

router.get("/today/count", authenticateToken, getTodayTaskCount);

router.get("/today", authenticateToken, getTodayTasks);

router.patch("/:taskId", authenticateToken, updateTaskCompletion);

export default router;
