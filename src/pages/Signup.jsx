import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', bio: '', role: 'ROLE_USER'
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!formData.username.trim()) e.username = 'Username is required';
    else if (formData.username.length < 3) e.username = 'At least 3 characters';
    if (!formData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email format';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 6) e.password = 'At least 6 characters';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setErrors({});
    setIsLoading(true);
    try {
      await api.post('/users/signup', {
        id: 0, username: formData.username, email: formData.email,
        password: formData.password, bio: formData.bio, role: formData.role
      });
      navigate('/login');
    } catch (err) {
      setGlobalError(err.response?.data || 'Signup failed. Please try again.');
    } finally { setIsLoading(false); }
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (globalError) setGlobalError('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', top: '-100px', right: '-100px', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', bottom: '-100px', left: '-100px', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }} className="animate-fade-up">
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '52px', height: '52px', margin: '0 auto 14px', borderRadius: '14px', background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Join <span className="gradient-text">SocialHub</span>
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>Connect. Share. Grow.</p>
        </div>

        <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '36px' }}>
          {globalError && (
            <div className="animate-scale-in" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: '600' }}>{globalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Input label="Username" placeholder="het_dev" value={formData.username} onChange={handleChange('username')} error={errors.username} />
              <Input label="Email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange('email')} error={errors.email} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Short Bio</label>
              <textarea
                placeholder="Tell the world about yourself..."
                value={formData.bio}
                onChange={handleChange('bio')}
                rows={2}
                style={{
                  width: '100%', background: 'var(--surface)', border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius)', padding: '14px 16px', fontSize: '14px',
                  fontFamily: 'var(--font)', color: 'var(--text)', outline: 'none', resize: 'none',
                  transition: 'all var(--transition)',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; e.target.style.background = 'var(--surface-2)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--surface)'; }}
              />
            </div>

            <Input label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange('password')} error={errors.password} />
            <Input label="Confirm Password" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} error={errors.confirmPassword} />

            <Button type="submit" loading={isLoading} style={{ width: '100%', marginTop: '4px', padding: '15px' }}>
              Create Account
            </Button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
