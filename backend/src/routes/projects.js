const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createProject, getProjects, getProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post([
    body('name').trim().notEmpty().withMessage('Project name required').isLength({ max: 100 }),
    body('description').optional().isLength({ max: 500 })
  ], createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;