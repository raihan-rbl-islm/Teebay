import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AddProduct } from './pages/AddProduct';
import { EditProduct } from './pages/EditProduct';
import { AllProducts } from './pages/AllProducts';
import { Layout } from './components/Layout';
import { ProductDetails } from './pages/ProductDetails';
import { Transactions } from './pages/Transactions';

function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES (No Navbar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* PROTECTED ROUTES (Has Navbar + Auth Check) */}
      {/* The Layout component handles the Auth Check and Navbar rendering */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/transactions" element={<Transactions />} />
      </Route>

      {/* Fallback: Redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;