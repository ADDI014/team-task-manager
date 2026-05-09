const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};


const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

const projectRole = (roles) => async (req, res, next) => {
  const Project = require('../models/Project');
  const project = await Project.findById(req.params.projectId || req.body.projectId);

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  const member = project.members.find(m => m.user.toString() === req.user._id.toString());
  const isOwner = project.owner.toString() === req.user._id.toString();

  if (!isOwner && (!member || !roles.includes(member.role))) {
    return res.status(403).json({ success: false, message: 'Insufficient project permissions.' });
  }

  req.project = project;
  next();
};

module.exports = { protect, adminOnly, projectRole };