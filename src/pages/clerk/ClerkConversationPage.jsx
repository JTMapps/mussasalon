import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js'; // fix path if needed

const ClerkConversationPage = () => {
  const { conversationId } = useParams();
  const [clerkId, setClerkId] = useState(null);
  const [clientEmail, setClientEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setClerkId(user.id);

      // Step 1: Get participants and find client email
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('profiles(email), user_id')
        .eq('conversation_id', conversationId);

      const client = participants.find(p => p.user_id !== user.id);
      setClientEmail(client?.profiles?.email ?? 'Client');

      // Step 2: Load messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(email)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
      setLoading(false);
    };

    loadData();
  }, [conversationId]);

  // Real-time messages
  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        sender_id: clerkId,
        content: newMessage,
      },
    ]);

    setNewMessage('');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat with {clientEmail}</h1>

      <div className="border rounded-lg p-4 h-96 overflow-y-scroll bg-white shadow">
        {loading ? (
          <p className="text-gray-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`my-2 p-3 rounded-md w-fit max-w-xs text-sm ${
                msg.sender_id === clerkId ? 'ml-auto bg-blue-100' : 'mr-auto bg-gray-100'
              }`}
            >
              <p>{msg.content}</p>
              <div className="text-right text-xs text-gray-400 mt-1">
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your reply..."
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

export default ClerkConversationPage;
