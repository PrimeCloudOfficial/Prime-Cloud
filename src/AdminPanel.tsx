import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface AdminPanelProps {
  onClose: () => void;
}

function ColoredText({ text }: { text: string }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            color: Math.random() > 0.5 ? '#00ff9d' : '#ffffff',
          }}
        >
          {char}
        </span>
      ))}
    </>
  );
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [launchTime, setLaunchTime] = useState('');
  const [launchEnabled, setLaunchEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfig();
    }
  }, [isAuthenticated]);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('config')
      .select('key, value')
      .in('key', ['launch_time', 'launch_enabled']);

    if (data) {
      const launchTimeConfig = data.find(c => c.key === 'launch_time');
      const launchEnabledConfig = data.find(c => c.key === 'launch_enabled');

      if (launchTimeConfig) {
        setLaunchTime(launchTimeConfig.value);
      }
      if (launchEnabledConfig) {
        setLaunchEnabled(launchEnabledConfig.value === 'true');
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'adminsetlaunchtime') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('access denied');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error: launchTimeError } = await supabase
        .from('config')
        .update({ value: launchTime, updated_at: new Date().toISOString() })
        .eq('key', 'launch_time');

      const { error: launchEnabledError } = await supabase
        .from('config')
        .update({ value: launchEnabled ? 'true' : 'false', updated_at: new Date().toISOString() })
        .eq('key', 'launch_enabled');

      if (launchTimeError || launchEnabledError) {
        setError('update failed');
      } else {
        setMessage('config updated successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError('update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <div className="admin-content">
          <div className="admin-header">
            <h2><ColoredText text="PRIME CLOUD ADMIN" /></h2>
            <button onClick={onClose} className="admin-close"><ColoredText text="×" /></button>
          </div>
          <form onSubmit={handleLogin} className="admin-login">
            <div className="admin-field">
              <label><ColoredText text="PASSWORD:" /></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input"
                autoFocus
              />
            </div>
            {error && <div className="admin-error"><ColoredText text={error} /></div>}
            <button type="submit" className="admin-button"><ColoredText text="AUTHENTICATE" /></button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-content">
        <div className="admin-header">
          <h2><ColoredText text="POSTING SCHEDULE CONFIG" /></h2>
          <button onClick={onClose} className="admin-close"><ColoredText text="×" /></button>
        </div>
        <form onSubmit={handleUpdate} className="admin-form">
          <div className="admin-field">
            <label><ColoredText text="SCHEDULE MESSAGE:" /></label>
            <input
              type="text"
              value={launchTime}
              onChange={(e) => setLaunchTime(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="admin-field admin-checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={launchEnabled}
                onChange={(e) => setLaunchEnabled(e.target.checked)}
              />
              <span><ColoredText text="SHOW SCHEDULE MESSAGE" /></span>
            </label>
          </div>
          {message && <div className="admin-success"><ColoredText text={message} /></div>}
          {error && <div className="admin-error"><ColoredText text={error} /></div>}
          <div className="admin-buttons">
            <button type="submit" className="admin-button" disabled={loading}>
              <ColoredText text={loading ? 'UPDATING...' : 'UPDATE CONFIG'} />
            </button>
            <button type="button" onClick={onClose} className="admin-button admin-button-secondary">
              <ColoredText text="CLOSE" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
