import { useState, useEffect } from 'react'

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    artist_name: '',
    appointment_date: '',
    duration: '',
    status: 'scheduled',
    notes: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAppointments();
    fetchCustomers();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      showMessage('error', 'Failed to fetch appointments');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/appointments/${editingId}` : '/api/appointments';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showMessage('success', editingId ? 'Appointment updated!' : 'Appointment scheduled!');
        setShowForm(false);
        setEditingId(null);
        setFormData({ customer_id: '', artist_name: '', appointment_date: '', duration: '', status: 'scheduled', notes: '' });
        fetchAppointments();
      }
    } catch (error) {
      showMessage('error', 'Failed to save appointment');
    }
  };

  const handleEdit = (appointment) => {
    setFormData({
      customer_id: appointment.customer_id,
      artist_name: appointment.artist_name,
      appointment_date: appointment.appointment_date.slice(0, 16),
      duration: appointment.duration,
      status: appointment.status,
      notes: appointment.notes || ''
    });
    setEditingId(appointment.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    
    try {
      await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      showMessage('success', 'Appointment deleted!');
      fetchAppointments();
    } catch (error) {
      showMessage('error', 'Failed to delete appointment');
    }
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Appointments</h1>
        <button 
          className="btn-primary" 
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ customer_id: '', artist_name: '', appointment_date: '', duration: '', status: 'scheduled', notes: '' });
          }}
        >
          {showForm ? 'Cancel' : '+ Schedule Appointment'}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>{editingId ? 'Edit Appointment' : 'New Appointment'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Customer *</label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Artist Name *</label>
              <input
                type="text"
                required
                value={formData.artist_name}
                onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Appointment Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            {editingId && (
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Notes</label>
              <textarea
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-success">
              {editingId ? 'Update Appointment' : 'Schedule Appointment'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>All Appointments ({appointments.length})</h2>
        {appointments.length === 0 ? (
          <p style={{ marginTop: '1rem', color: '#aaa' }}>No appointments yet. Schedule your first one!</p>
        ) : (
          <table style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Artist</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => (
                <tr key={apt.id}>
                  <td>{apt.customer_name}</td>
                  <td>{apt.artist_name}</td>
                  <td>{formatDateTime(apt.appointment_date)}</td>
                  <td>{apt.duration} min</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: apt.status === 'scheduled' ? '#646cff' : apt.status === 'completed' ? '#44ff44' : '#ff4444',
                      color: apt.status === 'completed' ? '#1a1a1a' : '#fff'
                    }}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(apt)} style={{ marginRight: '0.5rem' }}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(apt.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Appointments
