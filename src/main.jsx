import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { supabase } from './supabaseClient'; // adjust the path if needed

if (import.meta.env.DEV) {
  window.supabase = supabase;
  console.log('%c[Supabase] available as `window.supabase`', 'color: green');
}

import App from './App'

// Flowbite CSS & JS
import 'flowbite/dist/flowbite.min.css'
import 'flowbite'

// Tailwind + your custom utilities
import './style.css'



ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
