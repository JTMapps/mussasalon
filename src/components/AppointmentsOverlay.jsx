import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const AppointmentsOverlay = ({ cartItem, closePopup, onAppointmentSuccess }) => {
  // Local state for available dates, selected date and payment method.
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('deposit');
  const [error, setError] = useState('');

  // Calculate the total price using the service’s price plus any add-on prices.
  const totalPrice =
    (cartItem?.service?.price || 0) +
    (cartItem?.cart_item_add_ons
      ? cartItem.cart_item_add_ons.reduce(
          (sum, rel) => sum + (rel.add_on?.price || 0),
          0
        )
      : 0);

  // Compute remaining due based on payment method:
  // if "deposit" is chosen, remainingDue = totalPrice - 100 (but not negative),
  // if "full" is chosen then remainingDue = 0.
  const remainingDue =
    paymentMethod === 'deposit'
      ? totalPrice > 100
        ? totalPrice - 100
        : 0
      : 0;

  // Fetch available work schedule slots that are in the "available" state.
  useEffect(() => {
    const fetchAvailableDates = async () => {
      const { data, error } = await supabase
        .from('work_schedule')
        .select('id, datetime')
        .eq('state', 'available')
        .order('datetime', { ascending: true });
      if (error) {
        setError(error.message);
      } else {
        setAvailableDates(data);
      }
    };
    fetchAvailableDates();
  }, []);

  const handleSubmit = async () => {
    if (!selectedDate) {
      setError('Please select a reserved date.');
      return;
    }

    // Get current user session.
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (profileError) {
      setError(profileError.message);
      return;
    }
    if (profile.role === 'clerk') {
      setError('Clerks are not allowed to make appointments.');
      return;
    }

    // INSERT a new appointment record with the selected cart item, reserved date, and payment method.
    const { error: appointmentError } = await supabase
      .from('appointments')
      .insert([
        {
          cart_item_id: cartItem.id,
          reserved_date: selectedDate,
          payment_method: paymentMethod,
        },
      ]);
    if (appointmentError) {
      setError(appointmentError.message);
      return;
    }

    // Update the selected work schedule slot’s state to "reserved".
    const { error: updateSlotError } = await supabase
      .from('work_schedule')
      .update({ state: 'reserved' })
      .eq('id', selectedDate);
    if (updateSlotError) {
      setError(updateSlotError.message);
      return;
    }

    // On success, notify the parent component and close the overlay.
    onAppointmentSuccess();
    closePopup();
  };

  return (
    <div className="p-4 bg-black rounded shadow-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <h2 className="text-2xl font-bold mb-4">Make Appointment</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <div className="mb-4">
        <label className="block mb-2">Select Reserved Date:</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-grey-500 border rounded w-full"
        >
          <option value="">-- Select Date --</option>
          {availableDates.map((date) => (
            <option key={date.id} value={date.id}>
              {new Date(date.datetime).toLocaleString()}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Payment Method:</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="p-2 border rounded w-full"
        >
          <option value="deposit">Deposit</option>
          <option value="full">Full</option>
        </select>
      </div>

      {/* Display the calculated total price and remaining due */}
      <div className="mb-4">
        <p>
          <strong>Total Price:</strong> R{totalPrice}
        </p>
        <p>
          <strong>Remaining Due:</strong> R{remainingDue}
        </p>
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          className="px-4 py-2 bg-blue-900 text-white rounded rounded hover:text-blue-100 hover:bg-blue-700"
          onClick={handleSubmit}
        >
          Confirm Appointment
        </button>
        <button
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-grey-600"
          onClick={closePopup}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AppointmentsOverlay;
