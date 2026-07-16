import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  // Admin yang nyasar ke rute user -> lempar ke panel admin
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (!adminOnly && user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;

  return children;
}