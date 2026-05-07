'use client';

import { useState } from 'react';
import { ChatMessageResponse } from './api';
import Image from 'next/image';

interface ChatMessageItemProps {
  message: ChatMessageResponse;
  isOwn: boolean;
}

const formatTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString();
  } catch {
    return 'không rõ';
  }
};

export default function ChatMessageItem({ message, isOwn }: ChatMessageItemProps) {
  const [showViewer, setShowViewer] = useState(false);
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        {!isOwn && (
          <p className="text-xs font-semibold mb-1 opacity-75">{message.senderName}</p>
        )}

        {/* Text Message */}
        {message.messageText && (
          <p className="text-sm break-words">{message.messageText}</p>
        )}

        {/* Media Message */}
        {message.mediaUrl && message.mediaType?.startsWith('image') && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.mediaUrl}
              alt={message.fileName || 'media'}
              className="max-w-xs rounded cursor-pointer"
              style={{ maxHeight: '300px', objectFit: 'cover' }}
              onClick={() => setShowViewer(true)}
            />
            {showViewer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowViewer(false)}>
                <div className="relative">
                  <button onClick={() => setShowViewer(false)} className="absolute top-2 right-2 text-white text-2xl">✕</button>
                  <img src={message.mediaUrl} alt={message.fileName || 'media'} className="max-h-[80vh] max-w-[90vw] rounded" />
                </div>
              </div>
            )}
          </div>
        )}

        {message.mediaUrl && message.mediaType?.startsWith('video') && (
          <div className="mt-2">
            <video
              src={message.mediaUrl}
              controls
              className="max-w-xs rounded"
              style={{ maxHeight: '300px' }}
            />
          </div>
        )}

        {message.mediaUrl && !message.mediaType?.startsWith('image') && !message.mediaType?.startsWith('video') && (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`block mt-2 text-sm underline ${
              isOwn ? 'text-blue-100' : 'text-blue-600'
            }`}
          >
            📎 {message.fileName || 'Tải xuống'}
          </a>
        )}

        {/* Read Status & Time */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-xs ${
            isOwn ? 'text-blue-100' : 'text-gray-600'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            <span>
              {message.isReadByCurrentUser ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
