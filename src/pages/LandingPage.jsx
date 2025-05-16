// src/pages/LandingPage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import Header from "../components/Header/Header.jsx";;
import AppointmentLanding from '../components/AppointmentLanding/AppointmentLanding.jsx';
import Section from '../components/Section/Section.jsx';
import Button from '../components/Button/Button.jsx';
import LocationSection from '../components/LocationSection/LocationSection.jsx';

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    async function fetchUserProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const id = sessionData.session.user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', id)
          .single();
        setUser(sessionData.session.user);
        setRole(profile?.role || '');
      }
    }
    fetchUserProfile();
  }, []);

  // Only the embed URL as a string, not an iframe element
  const mapEmbedSrc =
    "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d168.13666727534618!2d29.457920377293615!3d-25.7654869148111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sMusa's%20Salon%2C%20Middelburg%20Mc%20Callum%20St!5e1!3m2!1sen!2sza!4v1746626993415!5m2!1sen!2sza";

  // Path to image inside /public
  const imageSrc = "/images/salon_interior.jpg";

  return (
    <>
      <Header />

      {user && role !== 'clerk' && (
        <Section title="Scheduled Appointments">
          <AppointmentLanding userId={user.id} />
        </Section>
      )}

      <Section
        title="Our Services"
        backgroundImage="/images/salon_services.jpg"
      >
        <p>Explore our professional salon services.</p>
        <Button to="/services">View Services</Button>
      </Section>

      {/* Updated Location Section */}
      <LocationSection imageSrc={imageSrc} mapEmbedSrc={mapEmbedSrc}>
        <p>Find us at 123 McCallum Street, Middelburg. 
          We're open Monday through Saturday, 9am-6pm. 
          Appointments Only</p>
      </LocationSection>
    </>
  );
}
