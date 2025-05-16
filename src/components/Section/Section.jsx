// src/components/Section/Section.jsx
import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function Section({
  title,
  children,
  backgroundImage,
  highlight = false,
  className = '',
}) {
  return (
    <section
      className={clsx(
        'section',
        highlight && 'section-highlight',
        backgroundImage && 'bg-cover bg-center bg-no-repeat relative text-pink py-6',
        !backgroundImage && 'text-pink',
        className
      )}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      <div
        className={clsx(
          'max-w-4xl mx-auto px-4',
          backgroundImage && 'bg-black/60 p-6 rounded-lg'
        )}
      >
        {title && (
          <h2 className="text-3xl font-bold mb-4 text-center">{title}</h2>
        )}
        <div className="text-lg">{children}</div>
      </div>
    </section>
  );
}

Section.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  backgroundImage: PropTypes.string,
  highlight: PropTypes.bool,
  className: PropTypes.string,
};
