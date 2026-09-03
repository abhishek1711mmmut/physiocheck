const express = require('express');
const Specialty = require('../models/Specialty');
const auth = require('../middleware/auth');
const sendResponse = require('../utils/response');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const specialties = await Specialty.find({}, 'name icon');
    sendResponse(res, 200, true, specialties, 'Specialties fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) return sendResponse(res, 404, false, null, 'Specialty not found', 'Specialty not found');
    sendResponse(res, 200, true, specialty, 'Specialty fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

module.exports = router;
