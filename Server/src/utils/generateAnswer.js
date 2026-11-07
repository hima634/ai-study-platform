import { GoogleGenAI } from '@google/genai';
import { retryWithBackoff } from './retryWithBackOff.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateAnswer = async (question, relevantChunks, recentHistory) => {
  const context = relevantChunks.map(c => c.text).join('\n\n---\n\n');
  const historyText = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');

  const prompt = `You are a helpful study assistant. Answer the student's question using ONLY the context provided below. If the context doesn't contain enough information, say so honestly rather than making things up.

Context from the textbook:
${context}

Recent conversation:
${historyText}

Student's question: ${question}

Answer:`;

  const response = await retryWithBackoff(() =>
    ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
      contents: prompt
    })
  );

  return response.text.trim();
};