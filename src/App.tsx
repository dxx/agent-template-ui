import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Chat from './pages/Chat';
import AuthGuard from './components/AuthGuard';
import { MessageProvider } from './components/Message';
import ProgressBar from './components/ProgressBar';
import RouteTitle from './components/RouteTitle';

function App() {
  return (
    <MessageProvider>
      <ProgressBar />
      <BrowserRouter>
        <RouteTitle />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/chat"
            element={
              <AuthGuard>
                <Chat />
              </AuthGuard>
            }
          />
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
      </BrowserRouter>
    </MessageProvider>
  );
}

export default App;
