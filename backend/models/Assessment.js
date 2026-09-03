const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true },
  specialtyName: { type: String, required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  commonFields: {
    patientName: String,
    age: Number,
    gender: String,
    diagnosis: String,
    vas: Number,
    nprs: Number
  },
  findings: { type: mongoose.Schema.Types.Mixed, default: {} },
  specialTestResults: { type: mongoose.Schema.Types.Mixed, default: {} },
  outcomeScores: { type: mongoose.Schema.Types.Mixed, default: {} },
  problemList: [String],
  goals: {
    shortTerm: [String],
    longTerm: [String]
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
