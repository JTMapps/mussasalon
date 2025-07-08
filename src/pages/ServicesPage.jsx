import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../supabaseClient';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from 'flowbite-react';

const ServicesPage = () => {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [message, setMessage] = useState('');
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;

      if (sessionUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();
        setUser(profile);
      }

      const [svcRes, addOnRes] = await Promise.all([
        supabase.from('services').select('*'),
        supabase.from('add_ons').select('*'),
      ]);

      if (svcRes.data) setServices(svcRes.data);
      if (addOnRes.data) setAddOns(addOnRes.data);
    };

    fetchData();
  }, []);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedAddOns([]);
    setTotalPrice(service.price);
    setMessage('');
    setShowAddOnModal(true);
  };

  const toggleAddOn = (addOn) => {
    const updated = selectedAddOns.includes(addOn.id)
      ? selectedAddOns.filter(id => id !== addOn.id)
      : [...selectedAddOns, addOn.id];

    const addOnTotal = updated.reduce((sum, id) => {
      const found = addOns.find(a => a.id === id);
      return sum + (found?.price || 0);
    }, 0);

    setSelectedAddOns(updated);
    setTotalPrice((selectedService?.price || 0) + addOnTotal);
  };

  const handleAddToCart = async () => {
    if (!selectedService || !user) {
      setMessage(user ? 'Please select a service.' : 'Please log in first.');
      return;
    }

    if (user.role === 'clerk') {
      setMessage('Clerks cannot add services to the cart.');
      return;
    }

    const { data: inserted, error: cartError } = await supabase
      .from('cart_items')
      .insert([{ user_id: user.id, service_id: selectedService.id }])
      .select();

    if (cartError || !inserted?.length) {
      console.error(cartError);
      setMessage(`Error adding to cart: ${cartError?.message}`);
      return;
    }

    if (selectedAddOns.length > 0) {
      const payload = selectedAddOns.map(id => ({
        cart_item_id: inserted[0].id,
        add_on_id: id,
      }));

      const { error: addOnsError } = await supabase
        .from('cart_item_add_ons')
        .insert(payload);

      if (addOnsError && !addOnsError.message.includes('duplicate key')) {
        console.error(addOnsError);
        setMessage('Error adding add-ons to cart.');
        return;
      }
    }

    Swal.fire({
      title: 'Added to Cart!',
      text: 'Proceed to your Profile to schedule the appointment.',
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#10b981',
      customClass: {
        popup: 'bg-gray-700 text-white rounded-lg',
        title: 'text-sm font-semibold',
        content: 'text-base',
        confirmButton: 'bg-emerald-500 hover:bg-emerald-600 text-white'
      },
    }).then(() => navigate('/profile'));

    setShowAddOnModal(false);
    setSelectedService(null);
    setSelectedAddOns([]);
    setTotalPrice(0);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Select a Service</h2>
      <ul>
        {services.map(service => (
          <li key={service.id} className="mb-4 flex items-center">
            <span className="font-bold">
              {service.name} — R{service.price}
            </span>
            {user && user.role !== 'clerk' && (
              <button
                className="ml-4 px-3 py-2 bg-blue-900 text-white rounded hover:text-blue-100 hover:bg-blue-700"
                onClick={() => handleServiceSelect(service)}
              >
                Select
              </button>
            )}
          </li>
        ))}
      </ul>

      {message && <p className="mt-4 text-lg font-semibold text-red-600">{message}</p>}

      <Modal
        show={showAddOnModal}
        size="md"
        popup
        onClose={() => setShowAddOnModal(false)}
      >
        <ModalHeader>
          <h3 className="text-lg font-semibold text-pink-400">
            {selectedService ? `Add-On Options for ${selectedService.name}` : 'Add-On Options'}
          </h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="font-medium">Base Price: R{selectedService?.price ?? '0'}</p>
            {selectedService?.has_add_on_options ? (
              <ul>
                {addOns.map(addOn => (
                  <li key={addOn.id} className="mb-2 flex items-center">
                    <span className="flex-1">{addOn.name} — R{addOn.price}</span>
                    <button
                      className="ml-4 px-3 py-2 bg-blue-900 text-white rounded hover:text-blue-100 hover:bg-blue-700"
                      onClick={() => toggleAddOn(addOn)}
                    >
                      {selectedAddOns.includes(addOn.id) ? 'Remove' : 'Add'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="italic text-gray-500">No add-on options for this service.</p>
            )}
            <p className="mt-4 font-semibold">Total: R{totalPrice}</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="success" onClick={handleAddToCart}>Confirm & Add to Cart</Button>
          <Button color="failure" onClick={() => setShowAddOnModal(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ServicesPage;
