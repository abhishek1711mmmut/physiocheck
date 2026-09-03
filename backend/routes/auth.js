const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendResponse = require('../utils/response');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, null, 'Email already registered', 'Email already registered');
    }

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    sendResponse(res, 201, true, {
      token,
      user: { id: user._id, name: user.name, email: user.email }
    }, 'Registration successful');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 400, false, null, 'Invalid credentials', 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendResponse(res, 400, false, null, 'Invalid credentials', 'Invalid credentials');
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    sendResponse(res, 200, true, {
      token,
      user: { id: user._id, name: user.name, email: user.email }
    }, 'Login successful');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

module.exports = router;
