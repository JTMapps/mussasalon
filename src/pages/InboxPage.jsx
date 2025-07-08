import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase'; // adjust the path as needed

const InboxPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch messages for the current user
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('sent_at', { ascending: true });

      if (!error) setMessages(data);
      setLoading(false);
    };

    fetchMessages();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new;
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // If clerk, fetch client list
  useEffect(() => {
    const getClients = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'clerk') {
        const { data } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('role', 'user');
        setClients(data);
      }
    };

    getClients();
  }, [user]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const targetId = receiver || (
      clients.length === 0 ? null :
      clients.find((c) => c.id !== user.id)?.id
    );

    if (!targetId) return alert("No recipient selected");

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: user.id,
        receiver_id: targetId,
        message_text: newMessage,
      },
    ]);

    if (!error) setNewMessage('');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>

      {clients.length > 0 && (
        <div className="mb-4">
          <label className="block mb-2 font-medium">Select a client:</label>
          <select
            className="form-select block w-full"
            onChange={(e) => setReceiver(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="border rounded-lg p-4 h-96 overflow-y-scroll bg-white shadow">
        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`my-2 p-3 rounded-md w-fit max-w-xs text-sm ${
                msg.sender_id === user.id ? 'ml-auto bg-blue-100' : 'mr-auto bg-gray-100'
              }`}
            >
              <p>{msg.message_text}</p>
              <div className="text-right text-xs text-gray-400 mt-1">
                {new Date(msg.sent_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="form-textarea w-full rounded-md"
          rows={2}
        />
        <button className="btn btn-primary" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default InboxPage;
