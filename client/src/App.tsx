import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AddProduct } from './pages/AddProduct';
import { EditProduct } from './pages/EditProduct';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Dashboard Route */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* Placeholder for the Add Product Wizard (We will build this next) */}
      <Route 
        path="/add-product" 
        element={isAuthenticated ? <AddProduct /> : <Navigate to="/login" />}
      />

      <Route 
        path="/edit-product/:id" 
        element={isAuthenticated ? <EditProduct /> : <Navigate to="/login" />} 
      />

    </Routes>
  );
}

export default App;