import { CreateProduct } from './pages/CreateProduct';
import { Home } from './pages/Home';
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
        <Route 
          path="/" 
          element={isAuthenticated ? <Home /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/create-product" 
          element={isAuthenticated ? <CreateProduct /> : <Navigate to="/login" />} 
        />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;