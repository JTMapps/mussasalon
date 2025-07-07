import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Top-level pages
import LandingPage from './pages/LandingPage';
import CreateAcc from './pages/CreateAcc';
import LoginPage from './pages/LoginPage';
import Profile from './pages/Profile';
import ServicesPage from './pages/ServicesPage';
import ClerkPage from './pages/ClerkPage';
import ForgotPass from './pages/ForgotPass';
import ContactUs from './pages/ContactUs';
import DeveloperInfo from './pages/DeveloperInfo';

// Messaging system
import ClerkInboxPage from './pages/clerk/ClerkInboxPage';
import ClerkConversationPage from './pages/clerk/ClerkConversationPage';
import ClientMessagesPage from './pages/client/ClientMessagesPage';

function App() {
  return (
    <Routes>
      {/* Public and common pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/create-account" element={<CreateAcc />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/forgot-password" element={<ForgotPass />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/about-dev" element={<DeveloperInfo />} />

      {/* Clerk-specific pages */}
      <Route path="/clerk" element={<ClerkPage />} />
      <Route path="/clerk/inbox" element={<ClerkInboxPage />} />
      <Route path="/clerk/messages/:conversationId" element={<ClerkConversationPage />} />

      {/* Client messaging entrypoint */}
      <Route path="/messages" element={<ClientMessagesPage />} />
    </Routes>
  );
}

export default App;
