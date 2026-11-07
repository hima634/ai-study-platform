import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/SingUp';
import Dashboard from './pages/Dashboard';
import DocumentChat from './pages/DocumentChat';
import DocumentNotes from './pages/DocumentNotes';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/documents/:documentId/chat" 
          element={<ProtectedRoute><DocumentChat /></ProtectedRoute>} 
          />
          <Route
               path="/documents/:documentId/notes"
               element={<ProtectedRoute><DocumentNotes /></ProtectedRoute>}
            />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;