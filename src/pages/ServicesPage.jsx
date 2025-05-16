// src/pages/ServicesPage.jsx
import React, { useState, useEffect } from 'react';
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

  // Fetch user, services, add-ons
  useEffect(() => {
    const initData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const userId = sessionData.session.user.id;
        const { data: profile, error: profileError } = await supabase
          .from('profiles').select('*').eq('id', userId).single();
        if (!profileError) setUser(profile);
      }
      const [svcRes, addOnRes] = await Promise.all([
        supabase.from('services').select('*'),
        supabase.from('add_ons').select('*'),
      ]);
      if (!svcRes.error) setServices(svcRes.data);
      if (!addOnRes.error) setAddOns(addOnRes.data);
    };
    initData();
  }, []);

  // Select always opens modal
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedAddOns([]);
    setTotalPrice(service.price);
    setMessage('');
    setShowAddOnModal(true);
  };

  // Toggle add-on in modal
  const toggleAddOn = (addOn) => {
    setSelectedAddOns(prev => {
      const updated = prev.includes(addOn.id)
        ? prev.filter(id => id !== addOn.id)
        : [...prev, addOn.id];
      // recalc total
      const addOnTotal = updated.reduce((sum, id) => {
        const found = addOns.find(a => a.id === id);
        return sum + (found?.price || 0);
      }, 0);
      setTotalPrice((selectedService?.price || 0) + addOnTotal);
      return updated;
    });
  };

  // Always called by modal's confirm button
  const handleAddToCart = async () => {
    if (!selectedService) {
      setMessage('Please select a service.');
      return;
    }
    if (!user) {
      setMessage('Please log in first.');
      return;
    }
    if (user.role === 'clerk') {
      setMessage('Clerks cannot add services to the cart.');
      return;
    }

    // 1) insert cart_item
    const { data: inserted, error: cartError } = await supabase
      .from('cart_items')
      .insert([{ user_id: user.id, service_id: selectedService.id }])
      .select();
    if (cartError || !inserted?.length) {
      console.error(cartError);
      setMessage(`Error adding to cart: ${cartError?.message}`);
      return;
    }
    const newCartItem = inserted[0];

    // 2) insert any add-ons
    if (selectedAddOns.length > 0) {
      const payload = selectedAddOns.map(id => ({
        cart_item_id: newCartItem.id,
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

    setMessage('Service added to cart successfully!');
    // reset & close modal
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

      {message && (
        <p className="mt-4 text-lg font-semibold">{message}</p>
      )}

      {/* Add-On Modal (always used) */}
      <Modal
        show={showAddOnModal}
        size="md"
        popup={true}
        onClose={() => setShowAddOnModal(false)}
      >
        <ModalHeader>
        <h3 className="text-lg font-semibold text-pink-400">
          {selectedService
            ? `Add-On Options for ${selectedService.name}`
            : 'Add-On Options'}
            </h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Base price */}
            <p className="font-medium">
              Base Price: R{selectedService?.price ?? '0'}
            </p>

            {/* Only if this service has options */}
            {selectedService?.has_add_on_options ? (
              <ul>
                {addOns.map(addOn => (
                  <li key={addOn.id} className="mb-2 flex items-center">
                    <span className="flex-1">
                      {addOn.name} — R{addOn.price}
                    </span>
                    <button
                      className="ml-4 px-3 py-2 bg-blue-900 text-white rounded hover:text-blue-100 hover:bg-blue-700"
                      onClick={() => toggleAddOn(addOn)}
                    >
                      {selectedAddOns.includes(addOn.id)
                        ? 'Remove'
                        : 'Add'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="italic text-gray-500">
                No add-on options for this service.
              </p>
            )}

            {/* Running total */}
            <p className="mt-4 font-semibold">Total: R{totalPrice}</p>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleAddToCart}
          >
            Confirm &amp; Add to Cart
          </button>
          <button
            className="px-4 py-2 bg-pink-900 text-white rounded hover:bg-pink-700 ml-2"
            onClick={() => setShowAddOnModal(false)}
          >
            Cancel
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ServicesPage;
