import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!pwd) e2.pwd = 'Password is required';
    else if (pwd.length < 6) e2.pwd = 'At least 6 characters';
    if (pwd !== confirm) e2.confirm = 'Passwords do not match';
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setErrors({}); setGlobalError(''); setIsLoading(true);
    try {
      await api.post('/users/reset-password', { token, newPassword: pwd });
      toast.success('Password updated! Signing you in...');
      setTimeout(() => navigate('/login'), 1500);
    } catch {
      setGlobalError('Link expired or invalid. Request a new one.');
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade-up">
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '52px', height: '52px', margin: '0 auto 14px', borderRadius: '14px', background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.02em' }}>New Password</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '6px' }}>Securely update your credentials.</p>
        </div>

        <div className="glass-strong" style={{ borderRadius: 'var(--radius-xl)', padding: '32px' }}>
          {globalError && (
            <div className="animate-scale-in" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: '600' }}>{globalError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input label="New Password" type="password" placeholder="••••••••" value={pwd} onChange={e => { setPwd(e.target.value); setErrors(p => ({ ...p, pwd: '' })); }} error={errors.pwd} />
            <Input label="Confirm Password" type="password" placeholder="••••••••" value={confirm} onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }} error={errors.confirm} />
            <Button type="submit" loading={isLoading} style={{ width: '100%', padding: '15px' }}>Update Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
