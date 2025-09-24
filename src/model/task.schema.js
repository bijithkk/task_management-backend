import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Task title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    cardColor: {
      type: String,
      match: /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/,
      default: "#ffffff",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: function () {
        return this.isRecurring;
      },
    },
    recurrenceDays: {
      type: [String],
    },
    tags: {
      type: [String], 
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.every(tag => typeof tag === "string");
        },
        message: "Tags must be an array of strings",
      },
      default: [],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

taskSchema.index({ userId: 1, task: 1 });

const TaskModel = mongoose.model("Task", taskSchema);

export default TaskModel;
