import TaskModel from "../model/task.schema.js";
import {
  asyncHandler,
  ResponseUtil,
  ApiError,
  HTTP_STATUS,
  calculatePagination,
  parseQueryParams,
} from "../utils/index.js";

export const createNewTask = asyncHandler(async (req, res) => {
  const {
    task,
    description,
    cardColor,
    isRecurring = false,
    recurrenceType,
    recurrenceDays = [],
    tags = [],
  } = req.body;

  if (!req.user || !req.user.id) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not authenticated");
  }

  const existingTask = await TaskModel.findOne({ userId: req.user.id, task });
  if (existingTask) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "A task with this title already exists"
    );
  }

  if (isRecurring) {
    if (
      !recurrenceType ||
      !["daily", "weekly", "monthly"].includes(recurrenceType)
    ) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid or missing recurrence type"
      );
    }
  }

  const cleanedTags = tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter((tag) => tag.length > 0);

  const newTask = await TaskModel.create({
    userId: req.user.id,
    task,
    description,
    cardColor,
    isRecurring,
    recurrenceType: isRecurring ? recurrenceType : undefined,
    recurrenceDays: isRecurring ? recurrenceDays : [],
    tags: cleanedTags,
  });

  const taskResponse = {
    id: newTask._id,
    task: newTask.task,
    description: newTask.description,
    cardColor: newTask.cardColor,
    isRecurring: newTask.isRecurring,
    recurrenceType: newTask.recurrenceType,
    recurrenceDays: newTask.recurrenceDays,
    tags: newTask.tags,
    createdAt: newTask.createdAt,
    updatedAt: newTask.updatedAt,
  };

  return ResponseUtil.created(res, taskResponse, "Task created successfully");
});

export const getAllTasks = asyncHandler(async (req, res) => {
  const { page, limit, search } = parseQueryParams(req.query);

  if (!req.user || !req.user.id) {
    throw new ApiError(401, "User not authenticated");
  }

  const query = { userId: req.user.id };

  if (search) {
    query.$or = [
      { task: { $regex: search, $options: "i" } }
    ];
  }

  const totalItems = await TaskModel.countDocuments(query);

  const pagination = calculatePagination({ page, limit, totalItems });

  const tasks = await TaskModel.find(query)
    .sort({ date: -1, task: 1 })
    .skip(pagination.skip)
    .limit(limit);

  const result = {
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    itemsPerPage: pagination.itemsPerPage,
    hasNextPage: pagination.hasNextPage,
    hasPreviousPage: pagination.hasPreviousPage,
    data: tasks,
  };

  return ResponseUtil.paginated(res, result, "Tasks retrieved successfully");
});

export const getTodayTaskCount = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // Get today's date (start and end of day)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Count tasks for today for the logged-in user
  const taskCount = await TaskModel.countDocuments({
    userId: req.user.id,
    date: { $gte: todayStart, $lte: todayEnd },
  });

  return res.status(200).json({
    todayTaskCount: taskCount,
  });
});

export const getTodayTasks = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const dayOfWeek = today.toLocaleString("en-US", { weekday: "long" }); // e.g., "Monday"
  const dayOfMonth = today.getDate();

  // Fetch tasks:
  const tasks = await TaskModel.find({
    userId: req.user.id,
    $or: [
      // One-time tasks scheduled for today
      { date: { $gte: today, $lte: todayEnd } },
      // Recurring tasks
      {
        isRecurring: true,
        $or: [
          { recurrenceType: "daily" },
          { recurrenceType: "weekly", recurrenceDays: dayOfWeek },
          {
            recurrenceType: "monthly",
            $expr: { $eq: [{ $dayOfMonth: "$date" }, dayOfMonth] },
          },
        ],
      },
    ],
  }).sort({ date: 1 });

  return res.status(200).json({
    todayTasks: tasks,
    count: tasks.length,
  });
});

export const updateTaskCompletion = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { isCompleted } = req.body;

  if (!req.user || !req.user.id) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not authenticated");
  }

  if (typeof isCompleted !== "boolean") {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "`isCompleted` must be a boolean"
    );
  }

  const task = await TaskModel.findOne({ _id: taskId, userId: req.user.id });
  if (!task) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Task not found");
  }

  task.isCompleted = isCompleted;
  await task.save();

  return ResponseUtil.success(
    res,
    "Task completion status updated successfully",
    task
  );
});
