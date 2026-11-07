import mongoose from 'mongoose';

const formulaSchema = new mongoose.Schema({
  name: String,
  formula: String,
  explanation: String
}, { _id: false });

const questionSchema = new mongoose.Schema({
  question: String,
  answer: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
}, { _id: false });

const noteSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sectionNumber: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  formulas: [formulaSchema],
  practiceQuestions: [questionSchema]
}, { timestamps: true });

export default mongoose.model('Note', noteSchema);