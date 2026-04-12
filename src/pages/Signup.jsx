import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '', // 👈 Added for your API
    role: 'ROLE_USER' // 👈 Default role for new signups
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }

    setIsLoading(true);

    try {
      /**
       * 🚀 SWAGGER MATCH:
       * We are now sending the exact JSON structure your API expects.
       */
      const signupPayload = {
        id: 0, // Backend will override this with DB sequence
        username: formData.username,
        email: formData.email,
        password: formData.password,
        bio: formData.bio,
        role: formData.role
      };

      // Change this line in Signup.jsx
await api.post('/users/signup', signupPayload); // 👈 Changed from /register to /signup
      
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data || "Signup failed. Check your API logs.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <div className="w-full max-w-[460px]">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v9m-1.5-1.5l1.5 1.5 1.5-1.5M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-widest">Connect with the world</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Username"
                placeholder="het_dev"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
              <Input 
                label="Email"
                type="email"
                placeholder="het@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            {/* Added Bio Field per your Swagger Schema */}
            <div className="flex flex-col gap-2 w-full text-left">
              <label className="text-sm font-bold text-slate-700 ml-1">Short Bio</label>
              <textarea
                placeholder="Tell us about yourself..."
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-white/50 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 text-slate-900 text-sm min-h-[80px]"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            <Input 
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />

            <Input 
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />

            <Button 
              type="submit" 
              loading={isLoading} 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-blue-100 shadow-xl mt-4"
            >
              Sign Up
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-slate-500 text-sm font-semibold">
              Already have an account? {' '}
              <Link to="/login" className="text-blue-600 font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;