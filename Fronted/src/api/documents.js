import api from './axios';

export const uploadDocument = async (file, title) => {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);

  const res = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data.document;
};

export const processDocument = async (documentId) => {
  const res = await api.post(`/documents/${documentId}/process`);
  return res.data.document;
};

export const getDocuments = async () => {
  const res = await api.get('/documents');
  return res.data.documents;
};

export const deleteDocument = async (documentId) => {
  await api.delete(`/documents/${documentId}`);
};