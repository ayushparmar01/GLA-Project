import React, { useState, useEffect, useRef } from 'react';
import { MentorshipMessageData } from '../../types';
import {
  fetchMentorshipMessagesApi,
  sendMentorshipMessageApi,
} from '../../services/api';
import { X, Send, MessageSquare, RefreshCw, User } from 'lucide-react';

interface MentorshipMessagingDrawerProps {
  relationshipId: string;
  currentUserId?: string;
  counterpartName?: string;
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
}

export const MentorshipMessagingDrawer: React.FC<MentorshipMessagingDrawerProps> = ({
  relationshipId,
  currentUserId,
  counterpartName,
  isOpen,
  onClose,
  token,
}) => {
  const [messages, setMessages] = useState<MentorshipMessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    if (!relationshipId) return;
    setLoading(true);
    try {
      const res = await fetchMentorshipMessagesApi(relationshipId, token);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, relationshipId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await sendMentorshipMessageApi(relationshipId, newMessage.trim(), token);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data!]);
        setNewMessage('');
      }
    } catch {
      // Ignore
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {counterpartName || 'Mentorship Chat'}
            </h3>
            <span className="text-[10px] text-gray-500">Private & encrypted participant thread</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMessages}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
            title="Refresh messages"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="py-20 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No messages exchanged yet.</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Start the discussion regarding meeting agendas, questions, or resources.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUserId && msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && msg.senderName && (
                  <span className="text-[10px] text-gray-500 mb-0.5 ml-1">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
