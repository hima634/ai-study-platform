import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import Document from '../models/Document.js';
import Chunk from '../models/Chunks.js';
import { chunkText } from '../utils/chunkText.js';
import { generateEmbedding } from '../utils/generateEmbedding.js';
import cloudinary from '../config/cloudinary.js';
import Note from '../models/Note.js';
import Progress from '../models/Progress.js';
import Chat from '../models/Chat.js';

// UPLOAD
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title } = req.body;

    const document = await Document.create({
      userId: req.user.id,
      title: title || req.file.originalname,
      fileUrl: req.file.path, // Cloudinary URL
      fileType: 'pdf',
      status: 'uploaded'
    });

    res.status(201).json({ message: 'Document uploaded successfully', document });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET ALL DOCUMENTS FOR LOGGED-IN USER
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ documents });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// run processing fucntion
const runProcessing = async (documentId, userId) => {
  try {
    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) return;

  
    await Chunk.deleteMany({ documentId });

    
    const response = await axios.get(document.fileUrl, { responseType: 'arraybuffer' });
    const parser = new PDFParse({ data: new Uint8Array(response.data) });
    const textResult = await parser.getText();
    document.extractedText = textResult.text;

    
    const chunks = chunkText(textResult.text);
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      await Chunk.create({
        documentId: document._id,
        userId,
        chunkIndex: i,
        text: chunks[i],
        embedding
      });
    }

    
    document.status = 'ready';
    await document.save();
  } catch (err) {
    console.error('Processing failed:', err.message);
    await Document.findByIdAndUpdate(documentId, { status: 'failed' });
  }
};

// PROCESS: do the work in the background
export const processDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = 'processing';
    await document.save();

    res.status(202).json({ message: 'Processing started', document });

    // Not awaited on purpose, so the work continues after the reply is sent
    runProcessing(document._id, req.user.id);
  } catch (err) {
    res.status(500).json({ message: 'Failed to start processing', error: err.message });
  }
};


// 
const getCloudinaryPublicId = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
};

const STALE_PROCESSING_MS = 15 * 60 * 1000;

// DELETE
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Don't delete while the background job is still creating chunks for it
    const stillProcessing =
      document.status === 'processing' &&
      Date.now() - document.updatedAt.getTime() < STALE_PROCESSING_MS;

    if (stillProcessing) {
      return res.status(409).json({
        message: 'This document is still processing. Try again in a few minutes.'
      });
    }

    // 1. Remove everything that belongs to this document
    const filter = { documentId: document._id, userId: req.user.id };
    await Promise.all([
      Chunk.deleteMany(filter),
      Note.deleteMany(filter),
      Progress.deleteMany(filter),
      Chat.deleteMany(filter)
    ]);

    await Document.deleteOne({ _id: document._id });

    
    try {
      const publicId = getCloudinaryPublicId(document.fileUrl);
      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw',
          invalidate: true
        });
        if (result.result !== 'ok') {
          console.warn('Cloudinary did not delete the file:', result.result, publicId);
        }
      }
    } catch (err) {
      console.error('Cloudinary delete failed:', err.message);
    }

    res.status(200).json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete document', error: err.message });
  }
};