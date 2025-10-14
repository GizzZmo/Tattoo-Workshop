import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Appointments from './pages/Appointments'
import Pricelist from './pages/Pricelist'
import Portfolio from './pages/Portfolio'
import TattooGenerator from './pages/TattooGenerator'
import Settings from './pages/Settings'

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path ? 'active' : '';
  
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
      </ul>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/pricelist" element={<Pricelist />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/generator" element={<TattooGenerator />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  )
}

export default App
