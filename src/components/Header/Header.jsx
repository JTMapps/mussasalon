import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useSessionUser from '../../hooks/useSessionUser';

export default function Header() {
  const { user, role } = useSessionUser();
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(prev => !prev);

  return (
    <nav className="header">
      <div className="header__inner">
        <Link to="/" className="header__logo">MusasSalon</Link>

        <div
          className={`${isOpen ? 'block' : 'hidden'} md:flex header__nav`}
          id="navbar-default"
        >
          <Link to="/about-dev" className="header__link">Developer Info</Link>

          {user && (
            <Link
              to={role === 'clerk' ? '/clerk/inbox' : '/messages'}
              className="header__link"
            >
              Messages
            </Link>
          )}

          <div className="header__auth">
            {user ? (
              <Link
                to={role === 'clerk' ? '/clerk' : '/profile'}
                className="text-white bg-purple-600 hover:bg-purple-900 font-medium rounded px-4 py-2"
              >
                {role === 'clerk' ? 'Clerk Dashboard' : 'Profile'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-white bg-purple-600 hover:bg-purple-900 hover:text-blue-100 font-medium rounded px-4 py-2"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        <button
          onClick={toggleMenu}
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-gray-400 hover:text-white md:hidden focus:outline-none"
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
    </nav>
  );
}
