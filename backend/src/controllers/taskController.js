const Task = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found.', status: 404 };
  const isMember = project.members.some(m => m.user.toString() === userId.toString());
  const isOwner = project.owner.toString() === userId.toString();
  if (!isMember && !isOwner) return { error: 'Access denied.', status: 403 };
  return { project };
};


exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { title, description, projectId, assignedTo, priority, dueDate } = req.body;
    const { error, status } = await checkProjectAccess(projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'Medium',
      dueDate: dueDate || null
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, assignedTo } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required.' });
    }

    const { error, status: errStatus } = await checkProjectAccess(projectId, req.user._id);
    if (error) return res.status(errStatus).json({ success: false, message: error });

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const { error, status } = await checkProjectAccess(task.project._id, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const { error, status } = await checkProjectAccess(task.project, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const { title, description, assignedTo, status: taskStatus, priority, dueDate } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (taskStatus) task.status = taskStatus;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task.' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    next(error);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    });

    const projectIds = projects.map(p => p._id);
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'name');

    const now = new Date();
    const stats = {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'Todo').length,
      inProgress: allTasks.filter(t => t.status === 'In Progress').length,
      done: allTasks.filter(t => t.status === 'Done').length,
      overdue: allTasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'
      ).length,
      myTasks: allTasks.filter(t =>
        t.assignedTo && t.assignedTo._id.toString() === req.user._id.toString()
      ).length
    };

    const recentTasks = allTasks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    res.json({ success: true, stats, recentTasks, projects });
  } catch (error) {
    next(error);
  }
};