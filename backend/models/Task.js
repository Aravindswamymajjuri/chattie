const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    wakeUp: {
      type: Boolean,
      default: false,
    },
    learningHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    dsaHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    projectHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    jobCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remarks: {
      type: String,
      default: '',
      maxlength: 1000,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// One record per user per day
taskSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Task', taskSchema);
