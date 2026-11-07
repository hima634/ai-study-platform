import express from 'express'
import upload from '../config/multer.js'

import protect from '../middleware/authMiddleware.js';
import { searchRelevantChunks } from '../utils/searchChunks.js';
import { generateNotes,getNotes } from '../controllers/noteController.js';
import { askQuestion } from '../controllers/chatController.js';
import { getProgress, getProgressSummary, saveProgress } from '../controllers/progressContoller.js';


import { uploadDocument, getDocuments, processDocument, deleteDocument } from '../controllers/documentController.js';

import { rateLimit } from '../middleware/rateLimiter.js';

const documentRouter=express.Router();

documentRouter.post('/upload', protect, upload.single('file'), uploadDocument);
documentRouter.get('/', protect, getDocuments);


// rate limits
const askPerMinute = rateLimit({ name: 'ask-min', limit: 10, windowSeconds: 60 });
const askPerDay = rateLimit({ name: 'ask-day', limit: 100, windowSeconds: 86400 });
const notesLimiter = rateLimit({ name: 'notes', limit: 5, windowSeconds: 3600 });
const processLimiter = rateLimit({ name: 'process', limit: 10, windowSeconds: 3600 });

documentRouter.post('/:documentId/ask', protect, askPerMinute, askPerDay, askQuestion);
documentRouter.post('/:documentId/generate-notes', protect, notesLimiter, generateNotes);
documentRouter.post('/:id/process', protect, processLimiter, processDocument);



documentRouter.post('/:id/search', protect, async (req, res) => {
  try {
    
    const { query } = req.body;
    console.log(query);
    const results = await searchRelevantChunks(query, req.params.id, req.user.id);
    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});




documentRouter.get('/:documentId/notes', protect, getNotes);


documentRouter.post('/:documentId/progress', protect, saveProgress);
documentRouter.get('/:documentId/progress', protect, getProgress);

documentRouter.get('/progress-summary', protect, getProgressSummary);

documentRouter.delete('/:id', protect, deleteDocument);

export default documentRouter