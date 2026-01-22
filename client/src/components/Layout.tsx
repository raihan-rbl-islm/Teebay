import { Outlet, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  const isAuthenticated = !!localStorage.getItem('token');

  // Guard: If not logged in, kick them out immediately
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      {/* <Outlet /> renders the child route (Dashboard, AllProducts, etc.) */}
      <Outlet />
    </>
  );
}