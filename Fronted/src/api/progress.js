import api from './axios';

export const getProgress = async (documentId) => {
  const res = await api.get(`/documents/${documentId}/progress`);
  return res.data.progress;
};

export const saveProgress = async (documentId, sectionNumber, questionIndex, correct) => {
  const res = await api.post(`/documents/${documentId}/progress`, {
    sectionNumber,
    questionIndex,
    correct
  });
  return res.data.progress;
};

export const getProgressSummary = async () => {
  const res = await api.get('/documents/progress-summary');
  return res.data.summary;
};  