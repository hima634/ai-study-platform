import Chunk from '../models/Chunks.js';
import Note from '../models/Note.js';
import Document from '../models/Document.js';
import { groupChunksIntoBatches } from '../utils/groupChunksIntoBatches.js';
import { generateStructuredContent } from '../utils/generateStructuedContent.js';

export const generateNotes = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Don't regenerate if notes already exist for this document
    const existingNotes = await Note.find({ documentId, userId });
    if (existingNotes.length > 0) {
      return res.status(200).json({ message: 'Notes already generated', notes: existingNotes });
    }

    const chunks = await Chunk.find({ documentId, userId }).sort({ chunkIndex: 1 });
    if (chunks.length === 0) {
      return res.status(400).json({ message: 'Document has not been processed into chunks yet' });
    }

    const batches = groupChunksIntoBatches(chunks, 5);
    const savedNotes = [];

    // Sequential processing to avoid rate limits
    for (let i = 0; i < batches.length; i++) {
      const batchText = batches[i].map(c => c.text).join('\n\n');
      const structured = await generateStructuredContent(batchText);

      const note = await Note.create({
        documentId,
        userId,
        sectionNumber: i + 1,
        notes: structured.notes,
        formulas: structured.formulas || [],
        practiceQuestions: structured.practiceQuestions || []
      });

      savedNotes.push(note);

  // Small delay between batches to respect per-minute rate limits
  if (i < batches.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 4000)); // 4 seconds
  }
    }

    res.status(201).json({
      message: 'Notes generated successfully',
      totalSections: savedNotes.length,
      notes: savedNotes
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate notes', error: err.message });
  }
};

export const getNotes = async (req, res) => {
  try {
    const { documentId } = req.params;
    const notes = await Note.find({ documentId, userId: req.user.id }).sort({ sectionNumber: 1 });
    res.status(200).json({ notes });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};