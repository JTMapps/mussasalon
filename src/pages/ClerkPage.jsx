// src/pages/ClerkPage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const ClerkPage = () => {
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [depositedReceipts, setDepositedReceipts] = useState([]);
  const [completeReceipts, setCompleteReceipts] = useState([]);
  const [dailyRoutine, setDailyRoutine] = useState([]);
  const [workSlots, setWorkSlots] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // helper to split array into chunks of length n
  const chunk = (arr, n) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += n) {
      chunks.push(arr.slice(i, i + n));
    }
    return chunks;
  };

  // --- Fetch Pending Appointments (isConfirmed == false) ---
  useEffect(() => {
    const fetchPendingAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          isConfirmed,
          payment_method,
          reserved_date,
          work_slot:work_schedule ( id, datetime, state ),
          cart_item:cart_items (
            user:profiles!cart_items_user_id_fkey ( username ),
            service:services ( id, name, price ),
            cart_item_add_ons ( add_on: add_ons ( id, name, price ) )
          )
        `)
        .eq('isConfirmed', false)
        .order('id', { ascending: false });
      if (error) {
        console.error("Error fetching pending appointments:", error.message);
        setError(error.message);
      } else {
        setPendingAppointments(data);
      }
    };
    fetchPendingAppointments();
  }, []);

  // --- Fetch Receipts (Deposited and Complete) ---
  useEffect(() => {
    const fetchReceipts = async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          appointment_id,
          total_price,
          remaining_due,
          is_paid,
          created_at,
          updated_at,
          appointment:appointments (
            payment_method,
            cart_item:cart_items (
              user:profiles!cart_items_user_id_fkey ( username ),
              service:services ( id, name, price ),
              cart_item_add_ons ( add_on: add_ons ( id, name, price ) )
            )
          )
        `)
        .order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching receipts:", error.message);
        setError(error.message);
      } else {
        const deposited = data.filter(
          r =>
            !r.is_paid &&
            r.appointment?.payment_method?.toLowerCase() === 'deposit'
        );
        const complete = data.filter(r => r.is_paid);
        setDepositedReceipts(deposited);
        setCompleteReceipts(complete);
      }
    };
    fetchReceipts();
  }, []);

  // --- Fetch Daily Routine Schedule ---
  useEffect(() => {
    const fetchDailyRoutine = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          reserved_date,
          isConfirmed,
          isCompleted,
          work_slot:work_schedule ( datetime ),
          cart_item:cart_items (
            user:profiles!cart_items_user_id_fkey ( username )
          )
        `)
        .eq('isConfirmed', true)
        .eq('isCompleted', false)
        .not('reserved_date', 'is', null)
        .order('reserved_date', { ascending: false });
      if (error) {
        console.error("Error fetching Daily Routine Schedule:", error.message);
        setError(error.message);
      } else {
        setDailyRoutine(data);
      }
    };
    fetchDailyRoutine();
  }, []);

  // --- Generate Available Work Slots ---
  const generateWorkSlots = async () => {
    const now = new Date();
    await supabase
      .from('work_schedule')
      .delete()
      .lt('datetime', now.toISOString());

    const slots = [];
    let daysAdded = 0;
    let day = new Date(now);
    while (daysAdded < 10) {
      if (day.getDay() >= 1 && day.getDay() <= 5) {
        [9, 11, 13, 15].forEach(hour => {
          const slot = new Date(day);
          slot.setHours(hour, 0, 0, 0);
          if (slot > now) slots.push(slot);
        });
        daysAdded++;
      }
      day.setDate(day.getDate() + 1);
    }

    const { data: usedSlots, error: usedError } = await supabase
      .from('work_schedule')
      .select('datetime')
      .in('state', ['available', 'reserved']);
    if (usedError) {
      setError(usedError.message);
      return;
    }

    const filteredSlots = slots.filter(slot => {
      return !usedSlots.some(
        used => new Date(used.datetime).getTime() === slot.getTime()
      );
    });

    setWorkSlots(filteredSlots);
  };

  useEffect(() => {
    generateWorkSlots();
  }, []);

  // --- Insert a New Work Slot ---
  const insertWorkSlot = async slot => {
    const { error } = await supabase
      .from('work_schedule')
      .insert([{ datetime: slot.toISOString(), state: 'available' }]);
    if (error) {
      console.error("Error inserting work slot:", error.message);
      setError(error.message);
    } else {
      alert("Work slot added successfully!");
      generateWorkSlots();
    }
  };

  // --- Build Appointment Description ---
  const buildAppointmentDescription = appointment => {
    if (!appointment?.cart_item) return "Appointment details not available";
    const serviceName = appointment.cart_item.service?.name || 'Unknown Service';
    const addOnNames = appointment.cart_item.cart_item_add_ons
      ?.map(rel => rel.add_on?.name)
      .filter(Boolean)
      .join(', ');
    return addOnNames ? `${serviceName} (${addOnNames})` : serviceName;
  };

  // --- Confirm a Pending Appointment ---
  const confirmPendingAppointment = async appointment => {
    const servicePrice = appointment.cart_item?.service?.price || 0;
    const addonTotal = appointment.cart_item?.cart_item_add_ons?.reduce(
      (sum, rel) => sum + (rel.add_on?.price || 0),
      0
    ) || 0;
    const totalPrice = servicePrice + addonTotal;
    const remainingDue =
      appointment.payment_method.toLowerCase() === 'deposit'
        ? totalPrice
        : 0;
    const isPaid = appointment.payment_method.toLowerCase() === 'full';

    const { error: receiptError } = await supabase
      .from('receipts')
      .insert([
        {
          appointment_id: appointment.id,
          total_price: totalPrice,
          remaining_due: remainingDue,
          is_paid: isPaid
        }
      ]);
    if (receiptError) {
      console.error("Error inserting receipt:", receiptError.message);
      setError(receiptError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ isConfirmed: true })
      .eq('id', appointment.id);
    if (updateError) {
      console.error("Error updating appointment:", updateError.message);
      setError(updateError.message);
      return;
    }

    setPendingAppointments(prev =>
      prev.filter(a => a.id !== appointment.id)
    );
  };

  // --- Mark a Deposited Receipt as Fully Paid ---
  const markReceiptAsPaid = async receiptId => {
    const { error } = await supabase
      .from('receipts')
      .update({
        is_paid: true,
        remaining_due: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', receiptId);
    if (error) {
      console.error("Error marking receipt as paid:", error.message);
      setError(error.message);
    } else {
      setDepositedReceipts(prev =>
        prev.filter(r => r.id !== receiptId)
      );
    }
  };

  // --- Mark an Appointment as Completed ---
  const markAppointmentAsCompleted = async appointmentId => {
    const { error } = await supabase
      .from('appointments')
      .update({ isCompleted: true })
      .eq('id', appointmentId);
    if (error) {
      console.error(
        "Error marking appointment as completed:",
        error.message
      );
      setError(error.message);
    } else {
      setDailyRoutine(prev =>
        prev.filter(item => item.id !== appointmentId)
      );
    }
  };

  // chunk the two scroll sections
  const completeCols = chunk(completeReceipts, 2);
  const workCols = chunk(workSlots, 2);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Clerk Dashboard</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button
        className="mb-4 px-4 py-2 bg-pink-900 text-white rounded hover:bg-pink-700"
        onClick={() =>
          supabase.auth.signOut().then(() => navigate('/'))
        }
      >
        Sign Out
      </button>

      {/* Daily Routine Schedule */}
      <section className="mb-8">
        <h3 className="text-xl font-bold mb-2">
          Daily Routine Schedule
        </h3>
        {dailyRoutine.length === 0 ? (
          <p>No appointments are currently scheduled.</p>
        ) : (
          dailyRoutine.map(item => {
            const username =
              item.cart_item?.user?.username || 'Unknown';
            const reservedDateDisplay = item.work_slot?.datetime
              ? new Date(item.work_slot.datetime).toLocaleString()
              : 'Not Reserved';
            return (
              <div
                key={item.id}
                className="border p-2 mb-2 flex flex-col gap-2"
              >
                <p>
                  <strong>User:</strong> {username}
                </p>
                <p>
                  <strong>Reserved Date:</strong>{' '}
                  {reservedDateDisplay}
                </p>
                <button
                  className="px-4 py-2 bg-blue-800 text-white rounded self-start"
                  onClick={() =>
                    markAppointmentAsCompleted(item.id)
                  }
                >
                  Complete
                </button>
              </div>
            );
          })
        )}
      </section>

      {/* Pending Appointments */}
      <section className="mb-8">
        <h3 className="text-xl font-bold mb-2">
          Appointments Pending Approval (first confirm that the payment was made)
        </h3>
        {pendingAppointments.length === 0 ? (
          <p>No pending appointments.</p>
        ) : (
          pendingAppointments.map(appointment => {
            const username =
              appointment.cart_item?.user?.username ||
              'Unknown User';
            const description = buildAppointmentDescription(
              appointment
            );
            const servicePrice =
              appointment.cart_item?.service?.price || 0;
            const addonTotal =
              appointment.cart_item?.cart_item_add_ons?.reduce(
                (sum, rel) => sum + (rel.add_on?.price || 0),
                0
              ) || 0;
            const totalPrice = servicePrice + addonTotal;
            const reservedDateDisplay = appointment.reserved_date
              ? new Date(
                  appointment.work_slot?.datetime
                ).toLocaleString()
              : 'Not Reserved';
            return (
              <div
                key={appointment.id}
                className="border p-4 mb-4"
              >
                <p>
                  <strong>User:</strong> {username}
                </p>
                <p>
                  <strong>Service:</strong> {description}
                </p>
                <p>
                  <strong>Total Price:</strong> R{totalPrice}
                </p>
                <p>
                  <strong>Payment Method:</strong>{' '}
                  {appointment.payment_method}
                </p>
                <p>
                  <strong>Reserved Date:</strong>{' '}
                  {reservedDateDisplay}
                </p>
                <button
                  className="mt-2 px-4 py-2 bg-blue-800 text-white rounded"
                  onClick={() =>
                    confirmPendingAppointment(appointment)
                  }
                >
                  Confirm Appointment
                </button>
              </div>
            );
          })
        )}
      </section>

      {/* Appointments with Deposit Paid */}
      <section className="mb-8">
        <h3 className="text-xl font-bold mb-2">
          Appointments with Deposit Paid
        </h3>
        {depositedReceipts.length === 0 ? (
          <p>No deposited appointments.</p>
        ) : (
          depositedReceipts.map(receipt => {
            const username =
              receipt.appointment?.cart_item?.user?.username ||
              'Unknown';
            return (
              <div
                key={receipt.id}
                className="border p-4 mb-4"
              >
                <p>
                  <strong>Client:</strong> {username}
                </p>
                <p>
                  <strong>Service:</strong>{' '}
                  {buildAppointmentDescription(
                    receipt.appointment
                  )}
                </p>
                <p>
                  <strong>Total Price:</strong> R
                  {receipt.total_price}
                </p>
                <p>
                  <strong>Remaining Due:</strong> R
                  {receipt.remaining_due}
                </p>
                <p>
                  <strong>Deposit Payment Confirmed:</strong>{' '}
                  {receipt.created_at
                    ? new Date(
                        receipt.created_at
                      ).toLocaleString()
                    : '-'}
                </p>
                <p>
                  <strong>Paid in Full:</strong>{' '}
                  {receipt.updated_at
                    ? new Date(
                        receipt.updated_at
                      ).toLocaleString()
                    : '-'}
                </p>
                <button
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                  onClick={() =>
                    markReceiptAsPaid(receipt.id)
                  }
                >
                  Mark as Fully Paid
                </button>
              </div>
            );
          })
        )}
      </section>

      {/* Appointments Fully Paid (2 rows per column, horizontal scroll) */}
      <section className="mb-8">
        <h3 className="text-xl font-bold mb-2">
          Appointments Fully Paid
        </h3>
        {completeReceipts.length === 0 ? (
          <p>No complete appointments.</p>
        ) : (
          <div className="flex overflow-x-auto space-x-4">
            {completeCols.map((col, idx) => (
              <div
                key={idx}
                className="flex-none w-1/2 flex flex-col space-y-4"
              >
                {col.map(r => (
                  <div
                    key={r.id}
                    className="border p-4 rounded shadow"
                  >
                    <p>
                      <strong>User:</strong>{' '}
                      {r.appointment?.cart_item?.user
                        ?.username || 'Unknown'}
                    </p>
                    <p>
                      <strong>Service:</strong>{' '}
                      {buildAppointmentDescription(
                        r.appointment
                      )}
                    </p>
                    <p>
                      <strong>Total Price:</strong> R
                      {r.total_price}
                    </p>
                    <p>
                      <strong>Deposit Confirmed:</strong>{' '}
                      {r.created_at
                        ? new Date(
                            r.created_at
                          ).toLocaleString()
                        : '-'}
                    </p>
                    <p>
                      <strong>Paid in Full:</strong>{' '}
                      {r.updated_at
                        ? new Date(
                            r.updated_at
                          ).toLocaleString()
                        : '-'}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Work Schedule Slot Insertion (2 rows per column, horizontal scroll) */}
      <section className="mb-8">
        <h3 className="text-xl font-bold mb-2">
          Work Schedule
        </h3>
        <p className="mb-2">
          Select a work slot to add manually. These slots will be available for future appointment bookings.
        </p>
        {workSlots.length === 0 ? (
          <p>No available work slots.</p>
        ) : (
          <div className="flex overflow-x-auto space-x-4">
            {workCols.map((col, idx) => (
              <div
                key={idx}
                className="flex-none w-1/2 flex flex-col space-y-4"
              >
                {col.map((slot, i) => (
                  <button
                    key={i}
                    className="w-full px-3 py-2 bg-purple-500 text-white rounded"
                    onClick={() => insertWorkSlot(slot)}
                  >
                    {slot.toLocaleString()}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ClerkPage;
