import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthDropdown = ({ onLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDropdown = () => setIsOpen(prev => !prev);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (tab === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      if (result.error) throw result.error;
      if (onLogin) onLogin(result.data.session?.user ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={toggleDropdown}>
        {isOpen ? 'Close' : 'Login'}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: 'white',
          border: '1px solid #ccc',
          padding: '1rem',
          width: '250px',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem' }}>
            <button onClick={() => setTab('login')} style={{ fontWeight: tab === 'login' ? 'bold' : 'normal' }}>Login</button>
            <button onClick={() => setTab('signup')} style={{ fontWeight: tab === 'signup' ? 'bold' : 'normal' }}>Sign Up</button>
          </div>

          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Submitting...' : (tab === 'login' ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          {error && <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>}
        </div>
      )}
    </div>
  );
};

export default AuthDropdown;
