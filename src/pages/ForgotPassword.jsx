// ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setIsLoading(true); setMessage(''); setError('');
    try {
      await api.post(`/users/forgot-password?email=${email}`);
      setIsSuccess(true);
      setMessage('Reset link sent! Check your inbox.');
    } catch {
      setIsSuccess(false);
      setMessage('If that email exists, a link has been sent.');
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade-up">
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '52px', height: '52px', margin: '0 auto 14px', borderRadius: '14px', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.02em' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '6px' }}>Enter your email and we'll send a magic link.</p>
        </div>

        <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '32px' }}>
          {message && (
            <div className="animate-scale-in" style={{ background: isSuccess ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`, borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: '24px', textAlign: 'center' }}>
              <span style={{ color: isSuccess ? 'var(--success)' : 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>{message}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} error={error} />
            <Button type="submit" loading={isLoading} style={{ width: '100%', padding: '15px' }}>Send Reset Link</Button>
          </form>
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text-3)', fontSize: '13px', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
