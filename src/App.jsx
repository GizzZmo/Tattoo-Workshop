import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Appointments from './pages/Appointments'
import Pricelist from './pages/Pricelist'
import Portfolio from './pages/Portfolio'
import TattooGenerator from './pages/TattooGenerator'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import UserManagement from './pages/UserManagement'

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  const isActive = (path) => location.pathname === path ? 'active' : '';

  // Don't show navigation on login page
  if (location.pathname === '/login') {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="nav">
      <ul>
        <li><Link to="/" className={isActive('/')}>Dashboard</Link></li>
        <li><Link to="/customers" className={isActive('/customers')}>Customers</Link></li>
        <li><Link to="/appointments" className={isActive('/appointments')}>Appointments</Link></li>
        <li><Link to="/pricelist" className={isActive('/pricelist')}>Pricelist</Link></li>
        <li><Link to="/portfolio" className={isActive('/portfolio')}>Portfolio</Link></li>
        <li><Link to="/generator" className={isActive('/generator')}>AI Generator</Link></li>
        <li><Link to="/settings" className={isActive('/settings')}>Settings</Link></li>
        {user?.role === 'admin' && (
          <li><Link to="/users" className={isActive('/users')}>Users</Link></li>
        )}
        <li><Link to="/profile" className={isActive('/profile')}>Profile</Link></li>
        <li style={{ marginLeft: 'auto' }}>
          <span style={{ marginRight: '1rem', color: '#666' }}>
            👤 {user?.name} ({user?.role})
          </span>
          <button 
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
      <Route path="/pricelist" element={<ProtectedRoute><Pricelist /></ProtectedRoute>} />
      <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
      <Route path="/generator" element={<ProtectedRoute><TattooGenerator /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navigation />
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
