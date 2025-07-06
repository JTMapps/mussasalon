// src/pages/CreateAcc.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

const CreateAcc = () => {
  const [username, setUsername] = useState(''); // For non‑OAuth sign-ups
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /**
   * Checks for an existing profile in the "profiles" table for the given user.
   * If one exists, updates the record; otherwise, inserts a new profile.
   */
  const handleProfileInsertOrUpdate = async (user, providedUsername = username) => {
    if (!user) return;
    // Use full_name from OAuth data if available, otherwise use the provided username.
    const desiredUsername = user.user_metadata?.full_name || providedUsername;
    // Check if a profile already exists.
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', fetchError.message);
      return { error: fetchError };
    }
    if (existingProfile) {
      // Update existing profile.
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: user.email,
          username: desiredUsername,
        })
        .eq('id', user.id);
      if (updateError) {
        console.error('Error updating profile:', updateError.message);
        return { error: updateError };
      }
    } else {
      // Insert new profile. Note: use "id" (not "user_id") to match the table schema.
      const { error: insertError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          email: user.email,
          username: desiredUsername,
        },
      ]);
      if (insertError) {
        console.error('Error inserting profile:', insertError.message);
        return { error: insertError };
      }
    }
    return {};
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      console.error('Sign-up error:', error.message);
      return;
    }
    console.log('User signed up:', data.user);
    // Create or update the profile.
    const profileRes = await handleProfileInsertOrUpdate(data.user, username);
    if (profileRes?.error) {
      setError(profileRes.error.message);
      return;
    }
    navigate('/profile', { replace: true });
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="glass-effect p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-3xl font-semibold mb-6 text-center text-white">Create Account</h2>
        <form onSubmit={handleSignUp}>
          <div className="mb-4">
            <label className="block text-white mb-2" htmlFor="username">Username</label>
            <input
              id="username"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
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
          <button  className="custom_button" type="submit">
            Create Account
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default CreateAcc;
