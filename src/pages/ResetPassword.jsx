import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token"); // 🕵️‍♂️ Magic: Grabs token from URL automatically
    const navigate = useNavigate();

    const [pwd, setPwd] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (pwd !== confirm) {
            return setMessage("❌ Passwords do not match.");
        }

        setIsLoading(true);
        try {
            // 🚀 Matches your @RequestBody ResetPasswordRequest { token, newPassword }
            await api.post('/users/reset-password', {
                token: token,
                newPassword: pwd
            });
            alert("✅ Password updated! Logging you in...");
            navigate('/login');
        } catch (err) {
            setMessage("❌ Link expired or token is invalid.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f8fafc]">
            <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900">Reset Password</h2>
                    <p className="text-slate-500 text-sm mt-2">Securely update your account credentials.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        required
                    />
                    <Input 
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                    <Button 
                        type="submit" 
                        loading={isLoading} 
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-100 mt-4"
                    >
                        Update Password
                    </Button>
                </form>

                {message && (
                    <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold text-center">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;