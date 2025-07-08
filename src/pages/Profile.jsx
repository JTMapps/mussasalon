import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import AppointmentsOverlay from '../components/AppointmentsOverlay';
import ListItems from '../components/ListItems/ListItems';
import useSessionUser from '../hooks/useSessionUser';

const Profile = () => {
  const { user, role, loading } = useSessionUser();
  const [profile, setProfile] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [showAppointmentOverlay, setShowAppointmentOverlay] = useState(false);
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfileAndCart = async () => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
      }

      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          *,
          service:services ( id, name, price ),
          cart_item_add_ons ( add_on: add_ons ( id, name, price ) ),
          appointment:appointments ( id )
        `)
        .eq('user_id', user.id);

      if (!cartError && cartData) {
        const activeItems = cartData.filter(
          item => !item.appointment || (Array.isArray(item.appointment) && item.appointment.length === 0)
        );
        setCartItems(activeItems);
      }
    };

    fetchProfileAndCart();
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!profile) return;

    const fetchCompletedAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          isConfirmed,
          isCompleted,
          reserved_date,
          work_slot:work_schedule ( datetime ),
          cart_item:cart_items (
            service:services ( name ),
            cart_item_add_ons ( add_on: add_ons ( name ) )
          )
        `)
        .eq('isConfirmed', true)
        .eq('isCompleted', true)
        .eq('cart_item.user_id', profile.id)
        .order('reserved_date', { ascending: false });

      if (!error) {
        setAppointmentHistory(data);
      }
    };

    fetchCompletedAppointments();
  }, [profile]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/');
  };

  const buildCartItemDetails = (item) => {
    const serviceName = item.service?.name || 'Unknown Service';
    const addOnNames = item.cart_item_add_ons?.map(rel => rel.add_on?.name).filter(Boolean).join(', ') || '';
    const addOnsTotal = item.cart_item_add_ons?.reduce((sum, rel) => sum + (rel.add_on?.price || 0), 0) || 0;
    const total = (item.service?.price || 0) + addOnsTotal;
    const remaining_due = total > 100 ? total - 100 : 0;
    const fullDescription = addOnNames ? `${serviceName} (${addOnNames})` : serviceName;
    return { fullDescription, total, remaining_due };
  };

  const handleCancelCartItem = async (cartItemId) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
    if (!error) setCartItems(cartItems.filter(item => item.id !== cartItemId));
  };

  const handleMakeAppointment = (cartItem) => {
    setSelectedCartItem(cartItem);
    setShowAppointmentOverlay(true);
  };

  const handleAppointmentSuccess = () => {
    setAppointmentSuccess(true);
    if (selectedCartItem) {
      setCartItems(cartItems.filter(item => item.id !== selectedCartItem.id));
    }
  };

  const handleConfirmationOk = () => {
    setAppointmentSuccess(false);
    navigate('/');
  };

  const buildAppointmentDescription = (app) => {
    const serviceName = app.cart_item?.service?.name || 'Unknown Service';
    const addOnNames = app.cart_item?.cart_item_add_ons?.map(rel => rel.add_on?.name).filter(Boolean).join(', ') || '';
    return addOnNames ? `${serviceName} (${addOnNames})` : serviceName;
  };

  if (loading) return <p className="text-center p-6">Loading profile...</p>;

  return (
    <div className="flex flex-col items-center p-6">
      <div className="w-full max-w-md p-4 border-b mb-6">
        <h2 className="text-2xl font-bold">User Information</h2>
        <p><strong>Username:</strong> {profile?.username}</p>
        <p><strong>Email:</strong> {profile?.email}</p>
        <button
          className="mt-4 px-4 py-2 bg-pink-900 text-white rounded hover:bg-pink-700"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>

      <div className="w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Your Cart Items</h3>
        {cartItems.length === 0 ? (
          <p>No services in cart.</p>
        ) : (
          cartItems.map(item => {
            const { fullDescription, total, remaining_due } = buildCartItemDetails(item);
            return (
              <div key={item.id} className="border p-4 mt-4">
                <p><strong>Service:</strong> {fullDescription}</p>
                <p><strong>Total Price:</strong> R{total}</p>
                <div className="flex space-x-4 mt-2">
                  {role !== 'clerk' && (
                    <button
                      className="px-4 py-2 bg-blue-900 text-white rounded hover:text-blue-100 hover:bg-blue-700"
                      onClick={() => handleMakeAppointment(item)}
                    >
                      Make Appointment
                    </button>
                  )}
                  <button
                    className="px-4 py-2 bg-pink-900 text-white rounded hover:text-blue-200 hover:bg-pink-700"
                    onClick={() => handleCancelCartItem(item.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="w-full max-w-md mt-8">
        <h3 className="text-xl font-bold mb-4">Appointments History</h3>
        <ListItems
          items={appointmentHistory}
          renderItem={app => {
            const reservedDate = app.work_slot?.datetime
              ? new Date(app.work_slot.datetime).toLocaleString()
              : "Not Reserved";
            return (
              <>
                <p><strong>Status:</strong> Completed</p>
                <p><strong>Service:</strong> {buildAppointmentDescription(app)}</p>
                <p><strong>Reserved Date:</strong> {reservedDate}</p>
              </>
            );
          }}
        />
      </div>

      {appointmentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-grey text-white p-6 rounded shadow-lg text-center">
            <p className="mb-4">
              The appointment was successfully reserved and is pending confirmation.
            </p>
            <p>Please be patient while your appointment is being processed.</p>
            <p>Appointments will only be scheduled after your deposit payment is acknowledged.</p>
            <button
              className="px-4 py-2 bg-blue-900 text-white rounded"
              onClick={handleConfirmationOk}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showAppointmentOverlay && selectedCartItem && (
        <AppointmentsOverlay
          cartItem={selectedCartItem}
          closePopup={() => setShowAppointmentOverlay(false)}
          onAppointmentSuccess={handleAppointmentSuccess}
        />
      )}

      {message && <p className="mt-4 text-lg font-semibold">{message}</p>}
    </div>
  );
};

export default Profile;
