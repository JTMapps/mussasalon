// src/pages/client/ClientMessagesPage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import useSessionUser from '../../hooks/useSessionUser';

const ClientMessagesPage = () => {
  const { user, loading: sessionLoading } = useSessionUser();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading || !user) return;

    const initializeChat = async () => {
      // Step 1: Check for existing conversation
      const { data: existing, error: existingError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .limit(1);

      let convId = existing?.[0]?.conversation_id;

      // Step 2: If no conversation, create it and add participants
      if (!convId) {
        const { data: clerk, error: clerkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'clerk')
          .limit(1)
          .single();

        if (clerkError || !clerk) {
          console.error('Failed to fetch clerk:', clerkError);
          setLoading(false);
          return;
        }

        // Safer insert with select
        const { data: inserted, error: insertError } = await supabase
          .from('conversations')
          .insert({})
          .select('id');

        if (insertError || !inserted?.length) {
          console.error('Failed to create conversation:', insertError);
          setLoading(false);
          return;
        }

        convId = inserted[0].id;

        const { error: participantError } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: convId, user_id: user.id },
            { conversation_id: convId, user_id: clerk.id },
          ]);

        if (participantError) {
          console.error('Failed to insert participants:', participantError);
          setLoading(false);
          return;
        }
      }

      setConversationId(convId);

      // Step 3: Load messages
      const { data: msgs, error: msgError } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(email)')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Failed to load messages:', msgError);
      }

      setMessages(msgs || []);
      setLoading(false);
    };

    initializeChat();
  }, [user, sessionLoading]);

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
    if (!newMessage.trim() || !conversationId || !user) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage,
    });

    if (error) {
      console.error('Failed to send message:', error);
      return;
    }

    setNewMessage('');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Contact Clerk</h1>

      <div className="border rounded-lg p-4 h-96 overflow-y-scroll bg-white shadow">
        {loading || sessionLoading ? (
          <p className="text-gray-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500">No messages yet. Start the conversation!</p>
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

export default ClientMessagesPage;
