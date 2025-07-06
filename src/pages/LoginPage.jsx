// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
  
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
    if (error) {
      setError(error.message);
      return;
    }
  
    console.log('Logged in:', data.user);
  
    // Fetch user role from the profile table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
  
    if (profileError) {
      console.error('Error fetching role:', profileError.message);
      setError('Failed to retrieve user role.');
      return;
    }
  
    // Navigate based on the role
    if (profileData?.role === 'clerk') {
      navigate('/clerk', { replace: true });
    } else {
      navigate('/profile', { replace: true });
    }
  };
  

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="glass-effect p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-3xl font-semibold mb-6 text-center text-white">Log In</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-white mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="custom_button" type="submit">
            Log In
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        <div>
          <p>is it your first time here?</p>
        <button onClick={() => navigate("/pages/create-account", { replace: true })}>
          Create Account
        </button>
        <p>did you forget your password?</p>
        <button onClick={() => navigate("/pages/forgot-password", { replace: true })}>
          Forgot Password?
        </button>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
