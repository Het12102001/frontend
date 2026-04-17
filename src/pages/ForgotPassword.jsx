import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            // 🚀 Matches your @RequestParam String email in UserController
            await api.post(`/users/forgot-password?email=${email}`);
            setMessage("✅ Link sent! Check your Mailtrap inbox.");
        } catch (err) {
            setMessage("❌ If that email exists, a reset link has been sent.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f8fafc]">
            <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900">Forgot Password</h2>
                    <p className="text-slate-500 text-sm mt-2">Enter your email to receive a magic reset link.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input 
                        label="Email Address"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button 
                        type="submit" 
                        loading={isLoading} 
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-100"
                    >
                        Send Reset Link
                    </Button>
                </form>

                {message && (
                    <div className={`mt-6 p-4 rounded-2xl text-sm font-bold text-center ${message.includes('✅') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        {message}
                    </div>
                )}
                
                <div className="mt-8 text-center border-t border-slate-50 pt-6">
                    <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-all uppercase tracking-widest text-[10px]">
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;