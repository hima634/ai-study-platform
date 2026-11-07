import mongoose from 'mongoose';
import Chunk from '../models/Chunks.js';
import { generateEmbedding } from './generateEmbedding.js';
import { getOrSet } from './cache.js';

export const searchRelevantChunks = async (query, documentId, userId, topK = 5) => {
 const normalized = query
  .toLowerCase()
  .replace(/[^\w\s]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const queryEmbedding = await getOrSet(
  `emb:gemini-embedding-001:${normalized}`,
  86400,
  () => generateEmbedding(query)
);

  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: topK,
        filter: {
          documentId: { $eq: new mongoose.Types.ObjectId(documentId) },
          userId: { $eq: new mongoose.Types.ObjectId(userId) }
        }
      }
    },
    {
      $project: {
        text: 1,
        chunkIndex: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]);

  return results;
};