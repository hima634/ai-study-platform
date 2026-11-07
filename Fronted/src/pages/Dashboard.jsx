import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDocuments, deleteDocument } from '../api/documents';
import { getProgressSummary } from '../api/progress';
import UploadForm from '../components/UploadForm';
import DocumentList from '../components/DocumentList';

const APP_NAME = 'AI Study Platform'; // change this to your app's name

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow-sm p-4">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressSummary, setProgressSummary] = useState({});

  const fetchDocuments = async () => {
    try {
      const [docs, summary] = await Promise.all([
        getDocuments(),
        getProgressSummary()
      ]);
      setDocuments(docs);
      setProgressSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc) => {
  const confirmed = window.confirm(
    `Delete "${doc.title}"? Its notes, chat and progress will be removed too.`
  );
  if (!confirmed) return;

  try {
    await deleteDocument(doc._id);
    setDocuments((prev) => prev.filter((d) => d._id !== doc._id));
    setProgressSummary((prev) => {
      const next = { ...prev };
      delete next[doc._id];
      return next;
    });
  } catch (err) {
    alert(err.response?.data?.message || 'Could not delete the document');
  }
};

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [documents]);

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleStatusUpdate = (updatedDoc) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc._id === updatedDoc._id ? updatedDoc : doc))
    );
  };

  // Summary numbers, calculated from data we already have
  const readyCount = documents.filter((d) => d.status === 'ready').length;
  const totals = Object.values(progressSummary).reduce(
    (acc, s) => ({
      total: acc.total + (s.totalQuestions || 0),
      answered: acc.answered + (s.answered || 0)
    }),
    { total: 0, answered: 0 }
  );
  const practicePercent =
    totals.total > 0 ? Math.round((totals.answered / totals.total) * 100) : 0;

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-gray-900">{APP_NAME}</span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-500">
              {user?.name}
            </span>
            <button
              onClick={logout}
              className="border border-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload a book, chat with it, and practice with generated questions.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Documents" value={documents.length} />
          <StatCard label="Ready" value={readyCount} />
          <StatCard label="Practice done" value={`${practicePercent}%`} />
        </div>

        {/* Upload */}
        <UploadForm
          onUploadSuccess={handleUploadSuccess}
          onStatusUpdate={handleStatusUpdate}
        />

        {/* Documents */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        ) : (
          <DocumentList
            documents={documents}
            progressSummary={progressSummary}
             onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;