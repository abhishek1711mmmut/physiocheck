const express = require('express');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const sendResponse = require('../utils/response');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { name, age, gender, diagnosis } = req.body;
    const patient = await Patient.create({
      therapistId: req.user.id,
      name, age, gender, diagnosis
    });
    sendResponse(res, 201, true, patient, 'Patient created successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ therapistId: req.user.id }).sort({ createdAt: -1 });
    sendResponse(res, 200, true, patients, 'Patients fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, therapistId: req.user.id });
    if (!patient) return sendResponse(res, 404, false, null, 'Patient not found', 'Patient not found');
    sendResponse(res, 200, true, patient, 'Patient fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

module.exports = router;
