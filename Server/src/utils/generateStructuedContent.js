import { GoogleGenAI } from '@google/genai';
import { retryWithBackoff } from './retryWithBackOff.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateStructuredContent = async (batchText) => {
  const prompt = `You are a study assistant. Based on the textbook content below, generate structured study material.

Textbook content:
${batchText}

Respond with ONLY valid JSON (no markdown, no code fences, no extra text) in exactly this shape:
{
  "notes": "a clear, concise summary of the key concepts in this section, written for a student studying this topic",
  "formulas": [
    { "name": "formula name", "formula": "the formula itself", "explanation": "brief explanation of what it means and when to use it" }
  ],
  "practiceQuestions": [
    { "question": "a practice question testing understanding of this section", "answer": "the correct answer with brief reasoning", "difficulty": "easy" }
  ]
}

If there are no formulas in this section, return an empty array for "formulas". Generate 3-5 practice questions covering different difficulty levels.`;

  const response = await retryWithBackoff(() =>
    ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: prompt
    })
  );

  let rawText = response.text.trim();

  // Safety net: strip markdown code fences if Gemini adds them despite instructions
  rawText = rawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();

  try {
    return JSON.parse(rawText);
  } catch (err) {
    throw new Error(`Failed to parse Gemini response as JSON: ${rawText.slice(0, 200)}`);
  }
};