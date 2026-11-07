import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  sectionNumber: {
    type: Number,
    required: true
  },
  questionIndex: {
    type: Number,
    required: true
  },
  correct: {
    type: Boolean,
    required: true
  }
}, { timestamps: true });

// One record per question per user, so re-answering updates instead of duplicating
progressSchema.index(
  { userId: 1, documentId: 1, sectionNumber: 1, questionIndex: 1 },
  { unique: true }
);

export default mongoose.model('Progress', progressSchema);