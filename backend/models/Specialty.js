const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'dropdown', 'checkbox', 'textarea'], default: 'checkbox' },
  options: [String]
}, { _id: false });

const subsectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fields: [fieldSchema]
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subsections: [subsectionSchema]
}, { _id: false });

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  resultOptions: { type: [String], default: ['Positive', 'Negative'] }
}, { _id: false });

const testGroupSchema = new mongoose.Schema({
  group: { type: String, required: true },
  tests: [testSchema]
}, { _id: false });

const outcomeMeasureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxScore: { type: Number },
  unit: { type: String }
}, { _id: false });

const specialtySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String },
  sections: [sectionSchema],
  specialTests: [testGroupSchema],
  outcomeMeasures: [outcomeMeasureSchema]
}, { timestamps: true });

module.exports = mongoose.model('Specialty', specialtySchema);
