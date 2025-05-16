// src/components/AppointmentLanding/AppointmentLanding.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../supabaseClient';
import ListItems from '../ListItems/ListItems.jsx';

export default function AppointmentLanding({ userId }) {
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          work_slot:work_schedule ( datetime ),
          cart_item:cart_items (
            service:services ( name, price ),
            cart_item_add_ons (
              add_on:add_ons ( name, price )
            )
          )
        `)
        .eq('isConfirmed', true)
        .eq('isCompleted', false)
        .eq('cart_item.user_id', userId)
        .order('datetime', { ascending: false, foreignTable: 'work_schedule' });

      if (error) {
        console.error("Error fetching scheduled appointments:", error.message);
        setError(error.message);
      } else {
        setScheduledAppointments(data);
      }
    };

    fetchAppointments();
  }, [userId]);

  const buildAppointmentDescription = (appt) => {
    const cart = appt.cart_item;
    if (!cart) return "Appointment details not available";

    const svc = cart.service || {};
    const serviceName = svc.name || 'Unknown Service';
    const servicePrice = svc.price != null ? `R${svc.price}` : '';

    const addOnDescs = (cart.cart_item_add_ons || [])
      .map(rel => {
        const ao = rel.add_on || {};
        if (!ao.name) return null;
        return ao.price != null
          ? `${ao.name} (R${ao.price})`
          : ao.name;
      })
      .filter(Boolean);

    return addOnDescs.length > 0
      ? `${serviceName} (${servicePrice}) + ${addOnDescs.join(', ')}`
      : `${serviceName} (${servicePrice})`;
  };

  const renderAppointment = (appt) => {
    const when = appt.work_slot?.datetime
      ? new Date(appt.work_slot.datetime).toLocaleString()
      : 'TBD';

    return (
      <div className="flex flex-col gap-7">
        <p><strong>Service:</strong> {buildAppointmentDescription(appt)}</p>
        <p><strong>When:</strong> {when}</p>
      </div>
    );
  };

  // Error state
  if (error) {
    return (
      <p className="text-red-500 mb-4">
        {error}
      </p>
    );
  }

  // Empty state
  if (scheduledAppointments.length === 0) {
    return (
      <p className="text-violet-300">
        You currently don’t have any appointments scheduled with us.
      </p>
    );
  }

  // Normal list
  return (
    <ListItems
      items={scheduledAppointments}
      renderItem={renderAppointment}
      containerClass="flex flex-col gap-4 w-full"
      itemClass="w-full p-4 border rounded"
    />
  );
}

AppointmentLanding.propTypes = {
  userId: PropTypes.string.isRequired,
};
