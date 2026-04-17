import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Feed from './pages/Feed';
import Profile from './pages/Profile'; 
import Chat from './components/Chat'; 
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* 🔒 The Protected Feed */}
        <Route path="/feed" element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        } />

        {/* 🔒 The Protected Profile Page */}
        <Route path="/profile/:username" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* 🔒 NEW: The Protected Chat Page */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />

        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Navigate to="/feed" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;