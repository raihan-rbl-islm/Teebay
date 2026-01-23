/**
 * App Component
 * ----------------------------------------------------------------------------
 * Main application component that defines all routes and their access levels.
 * 
 * Route Structure:
 * - Public Routes: Login and Register (no authentication required)
 * - Protected Routes: All other routes wrapped in Layout component
 *   - Layout component provides authentication guard and navbar
 *   - Includes: Dashboard, Products, Add/Edit Product, Transactions
 * - Fallback: Unknown routes redirect to login page
 */

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

/**
 * App Component
 * 
 * @returns Route configuration for the entire application
 */
function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES - No authentication required */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* PROTECTED ROUTES - Require authentication */}
      {/* Layout component handles authentication check and renders Navbar */}
      <Route element={<Layout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/transactions" element={<Transactions />} />
      </Route>

      {/* FALLBACK ROUTE - Redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;