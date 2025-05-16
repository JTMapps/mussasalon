// src/components/Button/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export default function Button({ children, variant = 'primary', to, ...props }) {
  const base = 'btn';
  const variantClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';

  const classNames = `${base} ${variantClass}`;

  if (to) {
    return (
      <Link to={to} className={classNames} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  to: PropTypes.string,
};
