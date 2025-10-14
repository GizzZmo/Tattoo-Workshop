import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <p>Required role(s): {roles.join(', ')}</p>
        <p>Your role: {user.role}</p>
      </div>
    );
  }

  return children;
}
