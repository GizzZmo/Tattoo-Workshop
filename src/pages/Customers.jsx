import { useState, useEffect } from 'react'

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      showMessage('error', 'Failed to fetch customers');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showMessage('success', editingId ? 'Customer updated!' : 'Customer added!');
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
        fetchCustomers();
      }
    } catch (error) {
      showMessage('error', 'Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      showMessage('success', 'Customer deleted!');
      fetchCustomers();
    } catch (error) {
      showMessage('error', 'Failed to delete customer');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Customer Management</h1>
        <button 
          className="btn-primary" 
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
          }}
        >
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-success">
              {editingId ? 'Update Customer' : 'Add Customer'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>All Customers ({customers.length})</h2>
        {customers.length === 0 ? (
          <p style={{ marginTop: '1rem', color: '#aaa' }}>No customers yet. Add your first customer!</p>
        ) : (
          <table style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.notes ? customer.notes.substring(0, 50) + '...' : '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(customer)} style={{ marginRight: '0.5rem' }}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(customer.id)}>
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

export default Customers
