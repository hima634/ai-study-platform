import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';

const statusStyles = {
  uploaded: 'bg-gray-100 text-gray-700',
  processing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700'
};

const DocumentList = ({ documents, progressSummary = {},onDelete }) => {
  if (documents.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-6">
        No documents uploaded yet.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Documents</h3>
      <ul className="space-y-3">
        {documents.map((doc) => {
          const stats = progressSummary[doc._id];
          const total = stats?.totalQuestions || 0;
          const answered = Math.min(stats?.answered || 0, total);

          return (
            <li
              key={doc._id}
              className="border border-gray-100 rounded-lg px-4 py-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 font-medium hover:text-blue-600 hover:underline"
                  >
                    {doc.title}
                  </a>
                  <p className="text-xs text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>

               <div className="flex items-center">
                  {doc.status === 'ready' && (
                    <>
                      <Link
                        to={`/documents/${doc._id}/chat`}
                        className="text-blue-600 text-sm hover:underline mr-3"
                      >
                        Chat
                      </Link>
                      <Link
                        to={`/documents/${doc._id}/notes`}
                        className="text-blue-600 text-sm hover:underline mr-3"
                      >
                        Notes
                      </Link>
                    </>
                  )}

                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[doc.status]}`}
                  >
                    {doc.status}
                  </span>

                  {onDelete && (
                    <button
                      onClick={() => onDelete(doc)}
                      title="Delete document"
                      className="ml-3 text-sm text-gray-400 hover:text-red-600 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {total > 0 && (
                <ProgressBar label="Practice progress" done={answered} total={total} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DocumentList;