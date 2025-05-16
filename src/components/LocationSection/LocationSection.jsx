// src/components/LocationSection/LocationSection.jsx
import React from 'react';

export default function LocationSection({ imageSrc, mapEmbedSrc, children }) {
  return (
    <section className="section-wrapper">
      <div
        className="relative h-[500px] bg-cover bg-center flex items-center justify-center text-white text-left px-4"
        style={{ backgroundImage: `url(${imageSrc})` }}
      >
        <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto bg-black/50 rounded-lg overflow-hidden">
          {/* Left: Text Content */}
          <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Our Location</h2>
            <div className="text-lg">{children}</div>
          </div>

          {/* Right: Embedded Map */}
          <div className="w-full md:w-1/2 h-[300px] md:h-auto">
            <iframe
              src={mapEmbedSrc}
              width="100%"
              height="100%"
              className="rounded-r-lg"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Map"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
