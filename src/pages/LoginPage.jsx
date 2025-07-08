import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button/Button.jsx';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const user = data.user;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Fetch Role] Error:', profileError.message);
      setErrorMsg('Failed to retrieve user role.');
      return;
    }

    const destination = profileData?.role === 'clerk' ? '/clerk' : '/profile';
    navigate(destination, { replace: true });
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="glass-effect p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-3xl font-semibold mb-6 text-center text-white">Log In</h2>

        <form onSubmit={handleLogin}>
          <label htmlFor="email" className="block text-white mb-2">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="password" className="block text-white mb-2">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mb-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button type="submit" className="custom_button w-full">
            Log In
          </button>
        </form>

        {errorMsg && <p className="text-red-500 mt-4">{errorMsg}</p>}

        <div className="mt-6 text-white space-y-2 text-center">
          <p>New here?</p>
          <Button to="/create-account">Create Account</Button>

          <p>Forgot your password?</p>
          <Button to="/forgot-password">Reset Password</Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
