import api from './axios';

export const generateNotes = async (documentId) => {
  const res = await api.post(`/documents/${documentId}/generate-notes`);
  return res.data;
};

export const getNotes = async (documentId) => {
  const res = await api.get(`/documents/${documentId}/notes`);
  return res.data.notes;
};