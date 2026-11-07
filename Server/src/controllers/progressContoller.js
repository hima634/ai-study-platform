import Progress from '../models/Progress.js';
import mongoose from 'mongoose';
import Note from '../models/Note.js';

export const saveProgress = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { sectionNumber, questionIndex, correct } = req.body;

    if (
      typeof sectionNumber !== 'number' ||
      typeof questionIndex !== 'number' ||
      typeof correct !== 'boolean'
    ) {
      return res.status(400).json({ message: 'Invalid progress data' });
    }

    const record = await Progress.findOneAndUpdate(
      { userId: req.user.id, documentId, sectionNumber, questionIndex },
      { correct },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    res.status(200).json({ progress: record });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save progress', error: err.message });
  }
};

export const getProgress = async (req, res) => {
  try {
    const { documentId } = req.params;
    const progress = await Progress.find({ userId: req.user.id, documentId });
    res.status(200).json({ progress });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


export const getProgressSummary = async (req, res) => {
  try {
    // aggregate() does not auto-cast strings to ObjectId, so do it explicitly
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [totals, answers] = await Promise.all([
      Note.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$documentId',
            totalQuestions: {
              $sum: { $size: { $ifNull: ['$practiceQuestions', []] } }
            }
          }
        }
      ]),
      Progress.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$documentId',
            answered: { $sum: 1 },
            correct: { $sum: { $cond: ['$correct', 1, 0] } }
          }
        }
      ])
    ]);

    const summary = {};
    totals.forEach((t) => {
      summary[t._id.toString()] = {
        totalQuestions: t.totalQuestions,
        answered: 0,
        correct: 0
      };
    });
    answers.forEach((a) => {
      const key = a._id.toString();
      if (summary[key]) {
        summary[key].answered = a.answered;
        summary[key].correct = a.correct;
      }
    });

    res.status(200).json({ summary });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};