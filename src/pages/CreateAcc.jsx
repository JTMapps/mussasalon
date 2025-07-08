import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

const CreateAcc = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const handleProfileUpsert = async (user, fallbackUsername = username) => {
    if (!user) return;

    const desiredUsername = user.user_metadata?.full_name || fallbackUsername;

    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Fetch Profile] Error:', fetchError.message);
      return { error: fetchError };
    }

    const payload = {
      email: user.email,
      username: desiredUsername,
    };

    if (existingProfile) {
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) {
        console.error('[Update Profile] Error:', error.message);
        return { error };
      }
    } else {
      const { error } = await supabase
        .from('profiles')
        .insert([{ id: user.id, ...payload }]);

      if (error) {
        console.error('[Insert Profile] Error:', error.message);
        return { error };
      }
    }

    return {};
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const user = data.user;

    const { error: profileError } = await handleProfileUpsert(user, username);
    if (profileError) {
      setErrorMsg(profileError.message);
      return;
    }

    navigate('/profile', { replace: true });
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="glass-effect p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-3xl font-semibold mb-6 text-center text-white">Create Account</h2>
        <form onSubmit={handleSignUp}>
          <label htmlFor="username" className="block text-white mb-2">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="email" className="block text-white mb-2">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="password" className="block text-white mb-2">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 mb-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button type="submit" className="custom_button">
            Create Account
          </button>
        </form>

        {errorMsg && <p className="text-red-500 mt-4">{errorMsg}</p>}
      </div>
    </div>
  );
};

export default CreateAcc;
