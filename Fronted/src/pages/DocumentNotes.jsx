import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generateNotes, getNotes } from '../api/notes';
import { getProgress, saveProgress } from '../api/progress';
import ProgressBar from '../components/ProgressBar';

const difficultyStyles = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700'
};

const DocumentNotes = () => {
  const { documentId } = useParams();
  const [notes, setNotes] = useState([]);
  const [progress, setProgress] = useState({}); // key: "section-questionIndex" -> correct (true/false)
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const progressKey = (sectionNumber, qIdx) => `${sectionNumber}-${qIdx}`;

  const fetchData = async () => {
    try {
      const [notesData, progressData] = await Promise.all([
        getNotes(documentId),
        getProgress(documentId)
      ]);
      setNotes(notesData);

      const map = {};
      progressData.forEach((p) => {
        map[progressKey(p.sectionNumber, p.questionIndex)] = p.correct;
      });
      setProgress(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [documentId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const data = await generateNotes(documentId);
      setNotes(data.notes);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate notes');
    } finally {
      setGenerating(false);
    }
  };

  const toggleAnswer = (key) => {
    setRevealedAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMark = async (sectionNumber, qIdx, correct) => {
    const key = progressKey(sectionNumber, qIdx);
    const previous = progress[key];

    // Update the UI immediately, roll back if the save fails
    setProgress((prev) => ({ ...prev, [key]: correct }));
    try {
      await saveProgress(documentId, sectionNumber, qIdx, correct);
    } catch (err) {
      setProgress((prev) => {
        const next = { ...prev };
        if (previous === undefined) delete next[key];
        else next[key] = previous;
        return next;
      });
      setError('Could not save your progress. Please try again.');
    }
  };

  // Progress calculations
  const countAnswered = (section) =>
    (section.practiceQuestions || []).filter(
      (_, i) => progress[progressKey(section.sectionNumber, i)] !== undefined
    ).length;

  const totalQuestions = notes.reduce(
    (sum, s) => sum + (s.practiceQuestions?.length || 0),
    0
  );
  const totalAnswered = notes.reduce((sum, s) => sum + countAnswered(s), 0);
  const totalCorrect = Object.values(progress).filter(Boolean).length;

  if (loading) {
    return <p className="text-center text-gray-500 py-10">Loading...</p>;
  }

  const section = notes[activeSection];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">
          ← Back to Documents
        </Link>
        <h2 className="text-lg font-semibold text-gray-800">Study Notes</h2>
        <div className="w-24" />
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        {notes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center space-y-4">
            <p className="text-gray-500">No notes generated yet for this document.</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              {generating ? 'Generating... this may take a minute' : 'Generate Notes'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall progress */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-2">
              <ProgressBar
                label="Overall progress"
                done={totalAnswered}
                total={totalQuestions}
              />
              {totalAnswered > 0 && (
                <p className="text-xs text-gray-500">
                  Score so far: {totalCorrect} of {totalAnswered} answered correctly
                </p>
              )}
            </div>

            {/* Section tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {notes.map((s, idx) => {
                const answered = countAnswered(s);
                const total = s.practiceQuestions?.length || 0;
                const complete = total > 0 && answered === total;
                return (
                  <button
                    key={s._id}
                    onClick={() => setActiveSection(idx)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      activeSection === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Section {s.sectionNumber} {complete && '✓'}
                  </button>
                );
              })}
            </div>

            {section && (
              <div className="space-y-6">
                {/* Notes */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {section.notes}
                  </p>
                </div>

                {/* Formulas */}
                {section.formulas?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Formulas</h3>
                    <div className="space-y-3">
                      {section.formulas.map((f, i) => (
                        <div key={i} className="border border-gray-100 rounded-lg p-4">
                          <p className="font-medium text-gray-800">{f.name}</p>
                          <p className="font-mono text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded mt-1 text-sm">
                            {f.formula}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">{f.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practice Questions */}
                {section.practiceQuestions?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Practice Questions
                    </h3>

                    <div className="mb-4">
                      <ProgressBar
                        label={`Section ${section.sectionNumber}`}
                        done={countAnswered(section)}
                        total={section.practiceQuestions.length}
                      />
                    </div>

                    <div className="space-y-4">
                      {section.practiceQuestions.map((q, i) => {
                        const key = progressKey(section.sectionNumber, i);
                        const result = progress[key]; // true, false, or undefined
                        const isRevealed = revealedAnswers[key] || result !== undefined;

                        return (
                          <div key={i} className="border border-gray-100 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-gray-800 font-medium">
                                {i + 1}. {q.question}
                              </p>
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${difficultyStyles[q.difficulty]}`}
                              >
                                {q.difficulty}
                              </span>
                            </div>

                            {isRevealed ? (
                              <div className="mt-2 space-y-3">
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                  {q.answer}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">
                                    Did you get it right?
                                  </span>
                                  <button
                                    onClick={() => handleMark(section.sectionNumber, i, true)}
                                    className={`px-3 py-1 rounded-lg text-sm transition ${
                                      result === true
                                        ? 'bg-green-600 text-white'
                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                    }`}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => handleMark(section.sectionNumber, i, false)}
                                    className={`px-3 py-1 rounded-lg text-sm transition ${
                                      result === false
                                        ? 'bg-red-600 text-white'
                                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                                    }`}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleAnswer(key)}
                                className="text-blue-600 text-sm hover:underline mt-2"
                              >
                                Show answer
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentNotes;