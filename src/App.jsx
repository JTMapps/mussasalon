import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage   from './pages/LandingPage'
import CreateAcc     from './pages/CreateAcc'
import LoginPage     from './pages/LoginPage'
import Profile       from './pages/Profile'
import ServicesPage  from './pages/ServicesPage'
import ClerkPage     from './pages/ClerkPage'
import ForgotPass    from './pages/ForgotPass'
import ContactUs     from './pages/ContactUs'
import DeveloperInfo from './pages/DeveloperInfo'

function App() {
  return (
    <Routes>
      <Route path="/"              element={<LandingPage   />} />
      <Route path="/create-account"element={<CreateAcc />} />
      <Route path="/login"         element={<LoginPage     />} />
      <Route path="/profile"       element={<Profile       />} />
      <Route path="/services"      element={<ServicesPage  />} />
      <Route path="/clerk"         element={<ClerkPage     />} />
      <Route path="/forgot-password" element={<ForgotPass  />} />
      <Route path="/contact-us"    element={<ContactUs    />} />
      <Route path="/about-dev"     element={<DeveloperInfo />} />
    </Routes>
  )
}

export default App
