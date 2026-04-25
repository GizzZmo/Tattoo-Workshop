import { useState, useEffect, useCallback } from 'react'

function StatCard({ emoji, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-emoji">{emoji}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function SimpleBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '0.7rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.9em' }}>
        <span style={{ color: '#ccc' }}>{label}</span>
        <span style={{ color: '#fff', fontWeight: 600 }}>${value.toFixed(2)}</span>
      </div>
      <div style={{ background: '#333', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color || '#646cff', height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    appointments: 0,
    portfolioItems: 0,
    pricelistItems: 0,
    invoices: 0,
  })

  const [analytics, setAnalytics] = useState(null)

  const fetchStats = useCallback(async () => {
    try {
      const [customers, appointments, portfolio, pricelist, invoices] = await Promise.all([
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/appointments').then(r => r.json()),
        fetch('/api/portfolio').then(r => r.json()),
        fetch('/api/pricelist').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
      ])

      setStats({
        customers: customers.length,
        appointments: appointments.length,
        portfolioItems: portfolio.length,
        pricelistItems: pricelist.length,
        invoices: invoices.length,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await fetch('/api/analytics').then(r => r.json())
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchAnalytics()
  }, [fetchStats, fetchAnalytics])

  const appointmentMap = {}
  if (analytics?.appointmentStats) {
    for (const s of analytics.appointmentStats) {
      appointmentMap[s.status] = s.count
    }
  }
  const totalAppts = Object.values(appointmentMap).reduce((a, b) => a + b, 0)

  const maxMonthlyRevenue = analytics?.monthlyRevenue?.length
    ? Math.max(...analytics.monthlyRevenue.map(m => m.revenue), 1)
    : 1

  return (
    <div className="container">
      <h1>🎨 Tattoo Workshop</h1>
      <p style={{ marginBottom: '2rem', color: '#aaa' }}>
        Comprehensive studio management suite — dashboard overview
      </p>

      {/* Top KPI cards */}
      <div className="stats-grid">
        <StatCard emoji="👥" label="Customers" value={stats.customers} />
        <StatCard emoji="📅" label="Appointments" value={stats.appointments} />
        <StatCard emoji="🖼️" label="Portfolio Items" value={stats.portfolioItems} />
        <StatCard emoji="💼" label="Services" value={stats.pricelistItems} />
        <StatCard emoji="🧾" label="Invoices" value={stats.invoices} />
        <StatCard
          emoji="💰"
          label="Total Revenue"
          value={analytics ? `$${analytics.totalRevenue.toFixed(2)}` : '—'}
          sub={analytics ? `$${analytics.outstandingBalance.toFixed(2)} outstanding` : ''}
        />
      </div>

      <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
        {/* Appointment Status Breakdown */}
        <div className="card">
          <h2>📅 Appointment Status</h2>
          {totalAppts === 0 ? (
            <p style={{ color: '#888', marginTop: '1rem' }}>No appointments yet.</p>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {[
                { key: 'scheduled', label: 'Scheduled', color: '#646cff' },
                { key: 'completed', label: 'Completed', color: '#28a745' },
                { key: 'cancelled', label: 'Cancelled', color: '#dc3545' },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, marginRight: '0.5rem', flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#ccc' }}>{label}</span>
                  <span style={{ fontWeight: 700 }}>{appointmentMap[key] || 0}</span>
                  <span style={{ color: '#888', fontSize: '0.85em', marginLeft: '0.4rem' }}>
                    ({totalAppts > 0 ? Math.round(((appointmentMap[key] || 0) / totalAppts) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="card">
          <h2>📊 Monthly Revenue</h2>
          {!analytics?.monthlyRevenue?.length ? (
            <p style={{ color: '#888', marginTop: '1rem' }}>No revenue data yet.</p>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {analytics.monthlyRevenue.map(m => (
                <SimpleBar
                  key={m.month}
                  label={m.month}
                  value={m.revenue}
                  max={maxMonthlyRevenue}
                />
              ))}
            </div>
          )}
        </div>

        {/* Top Services */}
        <div className="card">
          <h2>🏆 Top Services</h2>
          {!analytics?.topServices?.length ? (
            <p style={{ color: '#888', marginTop: '1rem' }}>No service data yet.</p>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {analytics.topServices.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #333' }}>
                  <span style={{ color: '#ccc', flex: 1, paddingRight: '0.5rem', fontSize: '0.9em' }}>{s.description}</span>
                  <span style={{ fontWeight: 600, color: '#646cff' }}>${s.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2>🕐 Recent Appointments</h2>
          {!analytics?.recentAppointments?.length ? (
            <p style={{ color: '#888', marginTop: '1rem' }}>No recent appointments.</p>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              {analytics.recentAppointments.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.6rem', gap: '0.5rem' }}>
                  <span
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: 4,
                      fontSize: '0.75em',
                      fontWeight: 700,
                      background: a.status === 'completed' ? '#1a3a1a' : a.status === 'cancelled' ? '#3a1a1a' : '#1a1a3a',
                      color: a.status === 'completed' ? '#4caf50' : a.status === 'cancelled' ? '#f44336' : '#7c85ff',
                      flexShrink: 0,
                    }}
                  >
                    {a.status}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.9em', color: '#ccc' }}>{a.customer_name}</span>
                  <span style={{ color: '#888', fontSize: '0.8em' }}>
                    {new Date(a.appointment_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Getting Started */}
        <div className="card">
          <h2>🚀 Getting Started</h2>
          <ol style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
            <li>Configure your Gemini API key in Settings</li>
            <li>Add your services to the Pricelist</li>
            <li>Register your first customer</li>
            <li>Schedule an appointment</li>
            <li>Try the AI Tattoo Generator</li>
            <li>Build your portfolio</li>
          </ol>
        </div>

        {/* Tips */}
        <div className="card">
          <h2>💡 Tips</h2>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
            <li>Keep customer information up to date</li>
            <li>Use the AI generator to explore design ideas</li>
            <li>Regularly update your portfolio</li>
            <li>Set realistic appointment durations</li>
            <li>Generate invoices from completed appointments</li>
            <li>Configure email notifications for automated reminders</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
