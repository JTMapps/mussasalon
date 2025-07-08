import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import useSessionUser from '../../hooks/useSessionUser';

const ClerkConversationPage = () => {
  const { conversationId } = useParams();
  const { user, role, loading: userLoading } = useSessionUser();
  const [clientEmail, setClientEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== 'clerk') return;

    const loadConversation = async () => {
      // Get client participant's email
      const { data: participants, error: participantError } = await supabase
        .from('conversation_participants')
        .select('profiles(email), user_id')
        .eq('conversation_id', conversationId);

      if (participantError) {
        console.error('Participant fetch error:', participantError);
        return;
      }

      const client = participants.find(p => p.user_id !== user.id);
      setClientEmail(client?.profiles?.email || 'Client');

      // Load conversation messages
      const { data: msgs, error: messageError } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(email)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messageError) {
        console.error('Messages fetch error:', messageError);
        return;
      }

      setMessages(msgs || []);
      setLoading(false);
    };

    loadConversation();
  }, [user, role, conversationId]);

  useEffect(() => {
    if (!conversationId) return;

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
    if (!newMessage.trim() || !user?.id) return;

    const { error } = await supabase.from('messages').insert([
      {
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage,
      },
    ]);

    if (error) {
      console.error('Send message error:', error);
      return;
    }

    setNewMessage('');
  };

  if (userLoading) return <p className="text-center mt-8 text-gray-400">Checking user...</p>;

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
                msg.sender_id === user.id ? 'ml-auto bg-blue-100' : 'mr-auto bg-gray-100'
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
