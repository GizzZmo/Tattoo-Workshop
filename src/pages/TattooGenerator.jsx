import { useState, useEffect } from 'react'

function TattooGenerator() {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchApiKey();
    fetchHistory();
  }, []);

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/settings/gemini_api_key');
      const data = await response.json();
      if (data.value) {
        setApiKey(data.value);
      }
    } catch (error) {
      console.error('Failed to fetch API key');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/generated-tattoos');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!apiKey) {
      showMessage('error', 'Please configure your Gemini API key in Settings first!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        showMessage('success', 'Tattoo design generated successfully!');
        fetchHistory();
      } else {
        showMessage('error', data.error || 'Failed to generate tattoo design');
      }
    } catch (error) {
      showMessage('error', 'Failed to generate tattoo design. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Tattoo Generator</h1>
      <p style={{ marginBottom: '2rem', color: '#aaa' }}>
        Powered by Google Gemini AI - Generate creative tattoo design descriptions
      </p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {!apiKey && (
        <div className="alert alert-info" style={{ marginBottom: '2rem' }}>
          ⚠️ Gemini API key not configured. Please add your API key in Settings to use this feature.
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Generate New Design</h2>
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label>Describe your tattoo idea *</label>
            <textarea
              rows="4"
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A phoenix rising from flames in traditional Japanese style, with vibrant colors and detailed feathers"
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !apiKey}
          >
            {loading ? '🤔 Generating...' : '✨ Generate Design Description'}
          </button>
        </form>

        {loading && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#646cff' }}>Consulting with AI artist... This may take a moment.</p>
          </div>
        )}

        {result && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '1rem', color: '#44ff44' }}>✅ Generated Design Description</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
              {result.description}
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card">
          <h2>Recent Generations ({history.length})</h2>
          <div style={{ marginTop: '1rem' }}>
            {history.slice(0, 10).map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  padding: '1rem', 
                  marginBottom: '1rem', 
                  backgroundColor: '#2a2a2a', 
                  borderRadius: '4px',
                  borderLeft: '3px solid #646cff'
                }}
              >
                <p style={{ color: '#aaa', fontSize: '0.85em', marginBottom: '0.5rem' }}>
                  {new Date(item.created_at).toLocaleString()}
                </p>
                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  &quot;{item.prompt}&quot;
                </p>
                <details>
                  <summary style={{ cursor: 'pointer', color: '#646cff' }}>
                    View generated description
                  </summary>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '1rem', 
                    backgroundColor: '#1a1a1a', 
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.9em',
                    lineHeight: '1.6'
                  }}>
                    {item.description}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem', backgroundColor: '#2a2a2a' }}>
        <h3>💡 Tips for Better Results</h3>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Be specific about the style (traditional, realistic, minimalist, etc.)</li>
          <li>Mention preferred placement (arm, back, leg, etc.)</li>
          <li>Describe desired size and level of detail</li>
          <li>Specify color preferences or if you want black & grey</li>
          <li>Include any symbolic meanings or themes</li>
          <li>Reference artistic influences or similar works</li>
        </ul>
      </div>
    </div>
  )
}

export default TattooGenerator
