import React from 'react';
import useSessionUser from '../hooks/useSessionUser';
import Header from "../components/Header/Header.jsx";
import AppointmentLanding from '../components/AppointmentLanding/AppointmentLanding.jsx';
import Section from '../components/Section/Section.jsx';
import Button from '../components/Button/Button.jsx';
import LocationSection from '../components/LocationSection/LocationSection.jsx';

export default function LandingPage() {
  const { user, role, loading } = useSessionUser();

  const mapEmbedSrc = "https://www.google.com/maps/embed?pb=...";
  const imageSrc = "/images/salon_interior.jpg";

  return (
    <>
      <Header />

      {!loading && user && role !== 'clerk' && (
        <Section title="Scheduled Appointments">
          <AppointmentLanding userId={user.id} />
        </Section>
      )}

      <Section title="Our Services" backgroundImage="/images/salon_services.jpg">
        <p>Explore our professional salon services.</p>
        <Button to="/services">View Services</Button>
      </Section>

      <LocationSection imageSrc={imageSrc} mapEmbedSrc={mapEmbedSrc}>
        <p>Find us at 1744 Kerk Str, Middelburg.</p>
        <p>We're open Monday through Saturday, 9am-6pm.</p>
        <p>Appointments Only</p>
      </LocationSection>
    </>
  );
}
