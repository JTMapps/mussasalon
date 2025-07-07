import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js'; // Adjust if needed

const ClerkInboxPage = () => {
  const [clerkId, setClerkId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadInbox = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setClerkId(user.id);

      // Step 1: Get all conversation IDs where clerk is a participant
      const { data: participantEntries } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      const convIds = participantEntries?.map(cp => cp.conversation_id) || [];

      if (convIds.length === 0) return;

      // Step 2: Get the latest message from each conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(email)')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      // Step 3: Group by conversation_id and keep only the latest message
      const latestByConversation = {};
      for (const msg of messages) {
        if (!latestByConversation[msg.conversation_id]) {
          latestByConversation[msg.conversation_id] = msg;
        }
      }

      // Step 4: Get client participant info (excluding clerk)
      const allParticipantData = await Promise.all(
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

      setConversations(allParticipantData);
    };

    loadInbox();
  }, []);

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
