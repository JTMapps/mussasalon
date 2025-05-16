// src/pages/ContactUs.jsx
import React, { useState } from 'react';

const ContactUs = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", form);
    // Call your backend API here
    setSubmitted(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      {submitted ? (
        <p className="text-green-500">
          Thank you for contacting us! We will get back to you soon.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col max-w-md form-container">
          <label htmlFor="name" className="mb-2 font-semibold">
            Name:
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mb-4 form-input"
          />

          <label htmlFor="email" className="mb-2 font-semibold">
            Email:
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mb-4 form-input"
          />

          <label htmlFor="message" className="mb-2 font-semibold">
            Message:
          </label>
          <textarea
            name="message"
            id="message"
            value={form.message}
            onChange={handleChange}
            required
            className="mb-4 form-input h-32"
          />

          <button type="submit" className="button-primary">
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactUs;
