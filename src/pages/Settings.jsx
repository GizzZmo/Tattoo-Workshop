import { useState, useEffect } from 'react'

function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/gemini_api_key');
      const data = await response.json();
      if (data.value) {
        setSavedApiKey(data.value);
        setApiKey(data.value);
      }
    } catch {
      console.error('Failed to fetch settings');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'gemini_api_key', value: apiKey })
      });

      if (response.ok) {
        setSavedApiKey(apiKey);
        showMessage('success', 'API key saved successfully!');
      } else {
        showMessage('error', 'Failed to save API key');
      }
    } catch {
      showMessage('error', 'Failed to save API key');
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to remove the API key?')) return;
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'gemini_api_key', value: '' })
      });

      if (response.ok) {
        setApiKey('');
        setSavedApiKey('');
        showMessage('success', 'API key removed!');
      }
    } catch {
      showMessage('error', 'Failed to remove API key');
    }
  };

  return (
    <div className="container">
      <h1>Settings</h1>
      <p style={{ marginBottom: '2rem', color: '#aaa' }}>
        Configure your Tattoo Workshop application
      </p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h2>🔑 Gemini API Configuration</h2>
        <p style={{ color: '#aaa', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Configure your Google Gemini API key to enable AI tattoo design generation
        </p>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
            />
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#aaa' }}>
              {savedApiKey ? '✅ API key is configured' : '❌ No API key configured'}
            </small>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-success">
              Save API Key
            </button>
            {savedApiKey && (
              <button type="button" className="btn-danger" onClick={handleClear}>
                Remove API Key
              </button>
            )}
          </div>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
          <h3>How to get a Gemini API key:</h3>
          <ol style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#646cff' }}>Google AI Studio</a></li>
            <li>Sign in with your Google account</li>
            <li>Click &quot;Get API Key&quot; or &quot;Create API Key&quot;</li>
            <li>Copy the generated API key</li>
            <li>Paste it in the field above and save</li>
          </ol>
          <p style={{ marginTop: '1rem', fontSize: '0.9em', color: '#aaa' }}>
            ⚠️ Keep your API key secure. It&apos;s stored locally in the database and only used to communicate with Google&apos;s AI services.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>📊 Application Information</h2>
        <table style={{ marginTop: '1rem' }}>
          <tbody>
            <tr>
              <td><strong>Version</strong></td>
              <td>1.0.0</td>
            </tr>
            <tr>
              <td><strong>Database</strong></td>
              <td>SQLite (Local Storage)</td>
            </tr>
            <tr>
              <td><strong>AI Engine</strong></td>
              <td>Google Gemini Pro</td>
            </tr>
            <tr>
              <td><strong>Backend</strong></td>
              <td>Node.js + Express</td>
            </tr>
            <tr>
              <td><strong>Frontend</strong></td>
              <td>React + Vite</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>🔒 Security & Privacy</h2>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>All data is stored locally on your server</li>
          <li>Customer information is stored securely in a local database</li>
          <li>API keys are encrypted in storage</li>
          <li>No data is shared with third parties except for AI generation requests</li>
          <li>Regular backups of your database are recommended</li>
        </ul>
      </div>

      <div className="card">
        <h2>ℹ️ About Tattoo Workshop</h2>
        <p style={{ lineHeight: '1.8', marginTop: '1rem' }}>
          Tattoo Workshop is a comprehensive studio management suite designed specifically for tattoo artists and studios. 
          It combines traditional business management features with cutting-edge AI technology to help you:
        </p>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Manage customer relationships and data</li>
          <li>Schedule and track appointments</li>
          <li>Maintain pricing and service information</li>
          <li>Showcase your portfolio</li>
          <li>Generate creative tattoo design ideas with AI</li>
        </ul>
      </div>
    </div>
  )
}

export default Settings
