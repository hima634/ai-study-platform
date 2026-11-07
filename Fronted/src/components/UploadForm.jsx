import { useState } from 'react';
import { uploadDocument, processDocument } from '../api/documents';

const UploadForm = ({ onUploadSuccess, onStatusUpdate }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      const document = await uploadDocument(file, title);
      onUploadSuccess(document); 
      setFile(null);
      setTitle('');
      e.target.reset();
      setUploading(false);

      // Fire processing in the background 
      processDocument(document._id)
        .then((updatedDoc) => onStatusUpdate(updatedDoc))
        .catch(() => onStatusUpdate({ ...document, status: 'failed' }));

    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold text-gray-800">Upload a Book/PDF</h3>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
};

export default UploadForm;