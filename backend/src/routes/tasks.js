const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTask, getTasks, getTask,
  updateTask, deleteTask, getDashboard
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);

router.route('/')
  .get(getTasks)
  .post([
    body('title').trim().notEmpty().withMessage('Task title required').isLength({ max: 200 }),
    body('projectId').notEmpty().withMessage('Project ID required'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('status').optional().isIn(['Todo', 'In Progress', 'Done'])
  ], createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;