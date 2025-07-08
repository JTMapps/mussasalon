import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import useSessionUser from '../../hooks/useSessionUser';

const ClerkInboxPage = () => {
  const navigate = useNavigate();
  const { user, role, loading: userLoading } = useSessionUser();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!user || role !== 'clerk') return;

    const loadInbox = async () => {
      // Step 1: Get conversation IDs the clerk participates in
      const { data: participantEntries, error: partErr } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (partErr || !participantEntries?.length) return;

      const convIds = participantEntries.map(cp => cp.conversation_id);

      // Step 2: Fetch messages sorted by created_at descending
      const { data: messages, error: msgErr } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(email)')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      if (msgErr || !messages?.length) return;

      // Step 3: Group messages by conversation_id (latest only)
      const latestByConversation = {};
      for (const msg of messages) {
        if (!latestByConversation[msg.conversation_id]) {
          latestByConversation[msg.conversation_id] = msg;
        }
      }

      // Step 4: Attach client email for each conversation
      const detailedConvs = await Promise.all(
        Object.keys(latestByConversation).map(async (convId) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id, profiles(email)')
            .eq('conversation_id', convId);

          const client = participants.find(p => p.user_id !== user.id);
          return {
            conversation_id: convId,
            client_email: client?.profiles?.email || 'Unknown',
            latest: latestByConversation[convId],
          };
        })
      );

      setConversations(detailedConvs);
    };

    loadInbox();
  }, [user, role]);

  if (userLoading) {
    return <p className="text-center text-gray-400">Loading your inbox...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Client Inboxes</h1>

      {conversations.length === 0 ? (
        <p className="text-gray-500">No client conversations yet.</p>
      ) : (
        <ul className="divide-y border rounded-lg bg-white shadow">
          {conversations.map((conv) => (
            <li
              key={conv.conversation_id}
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/clerk/messages/${conv.conversation_id}`)}
            >
              <div className="font-semibold">{conv.client_email}</div>
              <div className="text-sm text-gray-500 truncate">
                {conv.latest.content}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(conv.latest.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClerkInboxPage;
