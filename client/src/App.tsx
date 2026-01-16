import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Register } from './pages/Register';
import { Login } from './pages/Login';

function App() {
  // Simple check: Are we logged in?
  const isAuthenticated = !!localStorage.getItem('userId');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Route: If not logged in, go to Login */}
        <Route 
          path="/" 
          element={isAuthenticated ? <h1>Home Page (Coming Soon)</h1> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;