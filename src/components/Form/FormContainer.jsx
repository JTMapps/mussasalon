// src/components/Form/FormContainer.jsx
import React from 'react';
import PropTypes from 'prop-types';

export function FormContainer({ children, className = '' }) {
  return (
    <div className={`form-container ${className}`}>
      {children}
    </div>
  );
}

FormContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
