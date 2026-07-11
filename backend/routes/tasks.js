const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// ─── Helper ────────────────────────────────────────────────────────────────

/**
 * Compute the current streak (consecutive days ending today or yesterday that
 * have at least one non-zero field).
 */
function computeStreak(tasks) {
  if (!tasks || tasks.length === 0) return 0;

  // Sort descending by date
  const sorted = [...tasks].sort((a, b) => (a.date < b.date ? 1 : -1));

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let streak = 0;
  let expected = sorted[0].date === todayStr ? todayStr : yesterdayStr;

  for (const task of sorted) {
    if (task.date !== expected) break;
    const hasActivity =
      task.wakeUp ||
      task.learningHours > 0 ||
      task.dsaHours > 0 ||
      task.projectHours > 0 ||
      task.jobCount > 0;
    if (!hasActivity) break;
    streak++;
    // Move expected to previous day
    const d = new Date(expected);
    d.setDate(d.getDate() - 1);
    expected = d.toISOString().slice(0, 10);
  }

  return streak;
}

// ─── GET /api/tasks/stats — aggregate totals for dashboard ─────────────────
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const allTasks = await Task.find({ userId }).lean();

    const today = new Date().toISOString().slice(0, 10);

    // Week bounds (Mon–Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const diffToMon = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMon);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // Month bounds
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const todayTask = allTasks.find((t) => t.date === today) || null;
    const weekTasks = allTasks.filter((t) => t.date >= weekStartStr && t.date <= today);
    const monthTasks = allTasks.filter((t) => t.date >= monthStart && t.date <= today);

    const sum = (arr, field) => arr.reduce((acc, t) => acc + (t[field] || 0), 0);
    const totalHours = (t) => (t.learningHours || 0) + (t.dsaHours || 0) + (t.projectHours || 0);

    // Monthly completion: days with any activity / days elapsed this month
    const daysElapsed = Math.min(now.getDate(), monthTasks.length > 0 ? now.getDate() : 0);
    const activeDaysThisMonth = monthTasks.filter(
      (t) => t.wakeUp || totalHours(t) > 0 || t.jobCount > 0
    ).length;
    const monthlyCompletion = daysElapsed > 0 ? Math.round((activeDaysThisMonth / daysElapsed) * 100) : 0;

    const streak = computeStreak(allTasks);

    res.json({
      today: todayTask
        ? {
            wakeUp: todayTask.wakeUp,
            learningHours: todayTask.learningHours,
            dsaHours: todayTask.dsaHours,
            projectHours: todayTask.projectHours,
            jobCount: todayTask.jobCount,
            totalHours: totalHours(todayTask),
          }
        : null,
      weekly: {
        learningHours: sum(weekTasks, 'learningHours'),
        dsaHours: sum(weekTasks, 'dsaHours'),
        projectHours: sum(weekTasks, 'projectHours'),
        jobCount: sum(weekTasks, 'jobCount'),
        wakeUpDays: weekTasks.filter((t) => t.wakeUp).length,
        totalDays: weekTasks.length,
        totalHours: weekTasks.reduce((acc, t) => acc + totalHours(t), 0),
      },
      monthly: {
        completionPct: monthlyCompletion,
        learningHours: sum(monthTasks, 'learningHours'),
        dsaHours: sum(monthTasks, 'dsaHours'),
        projectHours: sum(monthTasks, 'projectHours'),
        jobCount: sum(monthTasks, 'jobCount'),
        totalHours: monthTasks.reduce((acc, t) => acc + totalHours(t), 0),
        activeDays: activeDaysThisMonth,
      },
      allTime: {
        learningHours: sum(allTasks, 'learningHours'),
        dsaHours: sum(allTasks, 'dsaHours'),
        projectHours: sum(allTasks, 'projectHours'),
        jobCount: sum(allTasks, 'jobCount'),
        totalHours: allTasks.reduce((acc, t) => acc + totalHours(t), 0),
        streak,
      },
    });
  } catch (err) {
    console.error('GET /api/tasks/stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/tasks/range — tasks between two dates ────────────────────────
router.get('/range', async (req, res) => {
  try {
    const { userId, from, to } = req.query;
    if (!userId || !from || !to) {
      return res.status(400).json({ message: 'userId, from, to required' });
    }
    const tasks = await Task.find({ userId, date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .lean();
    res.json(tasks);
  } catch (err) {
    console.error('GET /api/tasks/range error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/tasks/month — all tasks for a given month ────────────────────
router.get('/month', async (req, res) => {
  try {
    const { userId, month } = req.query; // month = YYYY-MM
    if (!userId || !month) {
      return res.status(400).json({ message: 'userId and month required' });
    }
    const from = `${month}-01`;
    const to = `${month}-31`;
    const tasks = await Task.find({ userId, date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .lean();
    res.json(tasks);
  } catch (err) {
    console.error('GET /api/tasks/month error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/tasks/year — all tasks for a given year ──────────────────────
router.get('/year', async (req, res) => {
  try {
    const { userId, year } = req.query;
    if (!userId || !year) {
      return res.status(400).json({ message: 'userId and year required' });
    }
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const tasks = await Task.find({ userId, date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .lean();
    res.json(tasks);
  } catch (err) {
    console.error('GET /api/tasks/year error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/tasks/:date — single day task ────────────────────────────────
router.get('/:date', async (req, res) => {
  try {
    const { userId } = req.query;
    const { date } = req.params;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    const task = await Task.findOne({ userId, date }).lean();
    res.json(task || null);
  } catch (err) {
    console.error('GET /api/tasks/:date error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/tasks — upsert a day's task ─────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { userId, date, wakeUp, learningHours, dsaHours, projectHours, jobCount, remarks } =
      req.body;
    if (!userId || !date) {
      return res.status(400).json({ message: 'userId and date required' });
    }

    const task = await Task.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          wakeUp: Boolean(wakeUp),
          learningHours: Number(learningHours) || 0,
          dsaHours: Number(dsaHours) || 0,
          projectHours: Number(projectHours) || 0,
          jobCount: Number(jobCount) || 0,
          remarks: String(remarks || ''),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(task);
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    if (err.code === 11000) {
      // Duplicate key — shouldn't happen with upsert but handle gracefully
      return res.status(409).json({ message: 'Task already exists for this date' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
