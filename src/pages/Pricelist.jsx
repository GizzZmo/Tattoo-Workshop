import { useState, useEffect, useCallback } from 'react'

function Pricelist() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    price: '',
    duration: '',
    category: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, []);

  const fetchPricelist = useCallback(async () => {
    try {
      const response = await fetch('/api/pricelist');
      const data = await response.json();
      setItems(data);
    } catch {
      showMessage('error', 'Failed to fetch pricelist');
    }
  }, [showMessage]);

  useEffect(() => {
    fetchPricelist();
  }, [fetchPricelist]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/pricelist/${editingId}` : '/api/pricelist';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showMessage('success', editingId ? 'Service updated!' : 'Service added!');
        setShowForm(false);
        setEditingId(null);
        setFormData({ service_name: '', description: '', price: '', duration: '', category: '' });
        fetchPricelist();
      }
    } catch {
      showMessage('error', 'Failed to save service');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      service_name: item.service_name,
      description: item.description || '',
      price: item.price,
      duration: item.duration || '',
      category: item.category || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await fetch(`/api/pricelist/${id}`, { method: 'DELETE' });
      showMessage('success', 'Service deleted!');
      fetchPricelist();
    } catch {
      showMessage('error', 'Failed to delete service');
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Pricelist</h1>
        <button 
          className="btn-primary" 
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ service_name: '', description: '', price: '', duration: '', category: '' });
          }}
        >
          {showForm ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>{editingId ? 'Edit Service' : 'Add New Service'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Service Name *</label>
              <input
                type="text"
                required
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                placeholder="e.g., Small Tattoos, Large Tattoos, Touch-ups"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Price ($) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Estimated Duration (minutes)</label>
              <input
                type="number"
                min="0"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-success">
              {editingId ? 'Update Service' : 'Add Service'}
            </button>
          </form>
        </div>
      )}

      {Object.keys(groupedItems).length === 0 ? (
        <div className="card">
          <p style={{ color: '#aaa' }}>No services yet. Add your first service!</p>
        </div>
      ) : (
        Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="card" style={{ marginBottom: '1.5rem' }}>
            <h2>{category}</h2>
            <table style={{ marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoryItems.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.service_name}</strong></td>
                    <td>{item.description || '-'}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>{item.duration ? `${item.duration} min` : '-'}</td>
                    <td>
                      <button onClick={() => handleEdit(item)} style={{ marginRight: '0.5rem' }}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}

export default Pricelist
