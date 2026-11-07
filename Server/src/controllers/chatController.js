import Chat from '../models/Chat.js';
import { rewriteQuery } from '../utils/rewriteQuery.js';
import { searchRelevantChunks } from '../utils/searchChunks.js';
import { generateAnswer } from '../utils/generateAnswer.js';

export const askQuestion = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // 1. Find or create the chat for this document + user
    let chat = await Chat.findOne({ userId, documentId });

    if (!chat) {
      chat = await Chat.create({ userId, documentId, messages: [] });
    }

    // Keep only recent history to keep prompts small (last 6 messages = ~3 turns)
    const recentHistory = chat.messages.slice(-6);

    // 2. Rewrite the question into a standalone version for retrieval
    const standaloneQuery = await rewriteQuery(recentHistory, question);
     console.log(standaloneQuery);
    
    // 3. Retrieve relevant chunks using the rewritten query
    const relevantChunks = await searchRelevantChunks(standaloneQuery, documentId, userId);
    

    // 4. Generate the answer using original question + chunks + history
    const answer = await generateAnswer(question, relevantChunks, recentHistory);

    // 5. Save both messages to chat history
    chat.messages.push({ role: 'user', content: question });
    chat.messages.push({ role: 'assistant', content: answer });
    await chat.save();

    res.status(200).json({
      answer,
      standaloneQuery, // useful for debugging — see what it rewrote to
      sources: relevantChunks.map(c => ({ chunkIndex: c.chunkIndex, score: c.score }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to answer question', error: err.message });
  }
};