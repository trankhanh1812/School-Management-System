'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatGroupResponse, ChatMessageResponse } from './api';
import ChatMessageItem from './chat-message-item';
import MessageInput from './message-input';
import AddGroupMembersModal from './components/AddGroupMembersModal';
import GroupMediaGallery from './components/GroupMediaGallery';

interface ChatWindowProps {
  group: ChatGroupResponse;
  messages: ChatMessageResponse[];
  onSendMessage: (data: {
    text?: string;
    media?: string;
    mediaType?: string;
    fileName?: string;
  }) => void;
  currentUserId: string;
  connected: boolean;
}

export default function ChatWindow({
  group,
  messages,
  onSendMessage,
  currentUserId,
  connected,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      try {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        return;
      } catch (e) {
        // fallback
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const displayMessages = (() => {
    const filtered = searchQuery
      ? messages.filter(
          (m) =>
            m.messageText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : messages;

    // Remove duplicates by message ID to prevent React key warnings
    const seen = new Set<string>();
    return filtered.filter((m) => {
      if (seen.has(m.id)) {
        return false;
      }
      seen.add(m.id);
      return true;
    });
  })();

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{group.groupName}</h2>
            <p className="text-sm text-gray-600">
              {group.memberCount} thành viên {!connected && '• Ngoại tuyến'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {connected && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 bg-green-600 rounded-full" />
                Đã kết nối
              </span>
            )}
            <button
              onClick={() => setShowMediaGallery(!showMediaGallery)}
              className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition"
              title="Xem tệp đa phương tiện"
            >
              📸
            </button>
            <button
              onClick={() => setShowAddMembers(true)}
              className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
            >
              + Thêm
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Tìm tin nhắn..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              {searchQuery ? 'Không tìm thấy tin nhắn nào' : 'Chưa có tin nhắn. Hãy bắt đầu trò chuyện!'}
            </p>
          </div>
        ) : (
          displayMessages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <MessageInput
          onSendMessage={onSendMessage}
          disabled={!connected}
        />
      </div>

      {/* Media Gallery Modal */}
      {showMediaGallery && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center" onClick={() => setShowMediaGallery(false)}>
          <div className="bg-white rounded-lg p-6 max-w-3xl max-h-96 overflow-y-auto w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Tệp đa phương tiện của nhóm</h3>
              <button onClick={() => setShowMediaGallery(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <GroupMediaGallery groupId={group.id} />
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      <AddGroupMembersModal
        open={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        groupId={group.id}
      />
    </div>
  );
}
