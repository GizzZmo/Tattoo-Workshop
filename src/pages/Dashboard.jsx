import { useState, useEffect } from 'react'

function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    appointments: 0,
    portfolioItems: 0,
    pricelistItems: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [customers, appointments, portfolio, pricelist] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/appointments').then(r => r.json()),
        fetch('/api/portfolio').then(r => r.json()),
        fetch('/api/pricelist').then(r => r.json())
      ]);

      setStats({
        customers: customers.length,
        appointments: appointments.length,
        portfolioItems: portfolio.length,
        pricelistItems: pricelist.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="container">
      <h1>Tattoo Workshop Dashboard</h1>
      <p style={{ marginBottom: '2rem', color: '#aaa' }}>
        Welcome to your comprehensive tattoo studio management suite
      </p>

      <div className="grid grid-2">
        <div className="card">
          <h2>📊 Quick Stats</h2>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Customers:</strong> {stats.customers}</p>
            <p><strong>Appointments:</strong> {stats.appointments}</p>
            <p><strong>Portfolio Items:</strong> {stats.portfolioItems}</p>
            <p><strong>Services:</strong> {stats.pricelistItems}</p>
          </div>
        </div>

        <div className="card">
          <h2>🎨 Features</h2>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
            <li>AI-Powered Tattoo Design Generator</li>
            <li>Customer Database Management</li>
            <li>Appointment Scheduling</li>
            <li>Dynamic Pricelist</li>
            <li>Portfolio Gallery</li>
            <li>Secure Data Storage</li>
          </ul>
        </div>

        <div className="card">
          <h2>🚀 Getting Started</h2>
          <ol style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
            <li>Configure your Gemini API key in Settings</li>
            <li>Add your services to the Pricelist</li>
            <li>Register your first customer</li>
            <li>Try the AI Tattoo Generator</li>
            <li>Build your portfolio</li>
          </ol>
        </div>

        <div className="card">
          <h2>💡 Tips</h2>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
            <li>Keep customer information up to date</li>
            <li>Use the AI generator to explore design ideas</li>
            <li>Regularly update your portfolio</li>
            <li>Set realistic appointment durations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
