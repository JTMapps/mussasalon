// src/components/Form/FormInput.jsx
import React from 'react';
import PropTypes from 'prop-types';

export function FormInput({ label, ...props }) {
  return (
    <div>
      {label && <label className="mb-2 font-semibold block">{label}</label>}
      <input className="form-input" {...props} />
    </div>
  );
}

FormInput.propTypes = {
  label: PropTypes.string,
};
