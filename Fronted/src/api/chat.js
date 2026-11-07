import api from './axios';

export const askQuestion = async (documentId, question) => {
  const res = await api.post(`/documents/${documentId}/ask`, { question });
  return res.data;
};