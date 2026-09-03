const express = require('express');
const Assessment = require('../models/Assessment');
const auth = require('../middleware/auth');
const sendResponse = require('../utils/response');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const assessment = await Assessment.create({
      ...req.body,
      therapistId: req.user.id
    });
    sendResponse(res, 201, true, assessment, 'Assessment saved successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const assessments = await Assessment.find({
      patientId: req.params.patientId,
      therapistId: req.user.id
    }).sort({ date: -1 });
    sendResponse(res, 200, true, assessments, 'Assessments fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      therapistId: req.user.id
    });
    if (!assessment) return sendResponse(res, 404, false, null, 'Assessment not found', 'Assessment not found');
    sendResponse(res, 200, true, assessment, 'Assessment fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

module.exports = router;
