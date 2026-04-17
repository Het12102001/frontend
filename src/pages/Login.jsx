import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!formData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email format';
    if (!formData.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const response = await api.post('/users/login', formData);
      login(response.data);
      navigate('/feed');
    } catch (err) {
      setGlobalError('Incorrect email or password. Please try again.');
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (globalError) setGlobalError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', width: '600px', height: '600px',
          borderRadius: '50%', top: '-200px', left: '-200px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          borderRadius: '50%', bottom: '-150px', right: '-150px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }} className="animate-fade-up">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px', margin: '0 auto 16px',
            borderRadius: '16px',
            background: 'var(--accent-gradient)',
            boxShadow: 'var(--shadow-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Social<span className="gradient-text">Hub</span>
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '14px', marginTop: '6px', fontWeight: '500' }}>
            Welcome back. Sign in to continue.
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '36px', }}>

          {/* Global error */}
          {globalError && (
            <div className="animate-scale-in" style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: '600' }}>{globalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <Link to="/forgot" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.opacity = '0.8'}
                  onMouseLeave={e => e.target.style.opacity = '1'}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange('password')}
                error={errors.password}
              />
            </div>

            <Button type="submit" loading={isLoading} style={{ width: '100%', marginTop: '4px', padding: '15px' }}>
              Sign In
            </Button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.opacity = '0.8'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-3)', fontSize: '11px', letterSpacing: '0.1em', fontWeight: '600', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
          Secured · Encrypted · Private
        </p>
      </div>
    </div>
  );
};

export default Login;
