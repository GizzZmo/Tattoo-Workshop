import { useState, useEffect, useCallback } from 'react'
import ImageCapture from '../components/ImageCapture'

function Portfolio() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    artist_name: '',
    tags: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showImageCapture, setShowImageCapture] = useState(false);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      setItems(data);
    } catch {
      showMessage('error', 'Failed to fetch portfolio');
    }
  }, [showMessage]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showMessage('success', 'Portfolio item added!');
        setShowForm(false);
        setFormData({ title: '', description: '', image_url: '', artist_name: '', tags: '' });
        setShowImageCapture(false);
        fetchPortfolio();
      }
    } catch {
      showMessage('error', 'Failed to add portfolio item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    
    try {
      await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      showMessage('success', 'Portfolio item deleted!');
      fetchPortfolio();
    } catch {
      showMessage('error', 'Failed to delete portfolio item');
    }
  };

  const handleImageCapture = (imageDataUrl) => {
    setFormData({ ...formData, image_url: imageDataUrl });
    setShowImageCapture(false);
    showMessage('success', 'Image captured successfully!');
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Portfolio</h1>
        <button 
          className="btn-primary" 
          onClick={() => {
            setShowForm(!showForm);
            setFormData({ title: '', description: '', image_url: '', artist_name: '', tags: '' });
            setShowImageCapture(false);
          }}
        >
          {showForm ? 'Cancel' : '+ Add Portfolio Item'}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>Add New Portfolio Item</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Image *</label>
              {!showImageCapture && (
                <div style={{ marginBottom: '1rem' }}>
                  <button 
                    type="button"
                    className="btn-primary" 
                    onClick={() => setShowImageCapture(true)}
                    style={{ marginRight: '1rem' }}
                  >
                    📷 Capture/Upload Image
                  </button>
                  <span style={{ color: '#aaa', fontSize: '0.9em' }}>
                    or enter URL below
                  </span>
                </div>
              )}
              {showImageCapture && (
                <ImageCapture 
                  onImageCapture={handleImageCapture}
                  onCancel={() => setShowImageCapture(false)}
                />
              )}
              {formData.image_url && (
                <div style={{ marginBottom: '1rem' }}>
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '200px', 
                      borderRadius: '4px',
                      display: 'block',
                      marginBottom: '0.5rem'
                    }} 
                  />
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                    style={{ fontSize: '0.85em' }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
              <input
                type="url"
                required
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Artist Name</label>
              <input
                type="text"
                value={formData.artist_name}
                onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., traditional, sleeve, color"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-success">
              Add to Portfolio
            </button>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card">
          <p style={{ color: '#aaa' }}>No portfolio items yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {items.map(item => (
            <div key={item.id} className="card">
              <img 
                src={item.image_url} 
                alt={item.title}
                style={{ 
                  width: '100%', 
                  height: '200px', 
                  objectFit: 'cover', 
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                }}
              />
              <h3>{item.title}</h3>
              {item.artist_name && (
                <p style={{ color: '#aaa', fontSize: '0.9em', marginTop: '0.5rem' }}>
                  Artist: {item.artist_name}
                </p>
              )}
              {item.description && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9em' }}>{item.description}</p>
              )}
              {item.tags && (
                <div style={{ marginTop: '0.5rem' }}>
                  {item.tags.split(',').map((tag, i) => (
                    <span 
                      key={i}
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        marginRight: '0.5rem',
                        marginTop: '0.5rem',
                        backgroundColor: '#2a2a2a',
                        borderRadius: '4px',
                        fontSize: '0.8em'
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
              <button 
                className="btn-danger" 
                onClick={() => handleDelete(item.id)}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Portfolio
