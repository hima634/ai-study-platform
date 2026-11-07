import { GoogleGenAI } from '@google/genai';
import { retryWithBackoff } from './retryWithBackOff.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const rewriteQuery = async (chatHistory, latestQuestion) => {
  // If there's no history yet, nothing to rewrite
  if (!chatHistory || chatHistory.length === 0) {
    return latestQuestion;
  }

const historyText = chatHistory
  .map(msg => `${msg.role}: ${msg.content.slice(0, 300)}`)
  .join('\n');

const prompt = `Rewrite the follow-up question into a standalone question that includes any context it needs from the conversation.

Rules:
- Output ONLY the rewritten question, as one short plain question.
- Do not add phrases like "based on the provided context" or "according to the text".
- If the follow-up is already a complete standalone question, return it unchanged.

Conversation history:
${historyText}

Follow-up question: ${latestQuestion}

Standalone question:`;

  const response = await retryWithBackoff(() =>
   ai.models.generateContent({
     model: process.env.GEMINI_MODEL,
    contents: prompt
  })
  );

  return response.text.trim();
};