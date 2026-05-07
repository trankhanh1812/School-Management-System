'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/hooks/use-auth-session';
import chatApi, { ChatGroupResponse } from './api';

export default function FloatingChatButton() {
  const authContext = useAuthSession();
  const session = authContext?.session;
  const isAuthHydrated = (authContext as any)?.isAuthHydrated;
  const user = session?.user;
  const token = session?.tokens.accessToken;
  const [unreadCount, setUnreadCount] = useState(0);
  const [groups, setGroups] = useState<ChatGroupResponse[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Wait for auth to hydrate
    if (!isAuthHydrated) return;
    
    if (!user || !token) {
      setUnreadCount(0);
      setGroups([]);
      return;
    }

    // Load groups and calculate unread count
    const loadUnreadCount = async () => {
      try {
        const data = await chatApi.listMyGroups(0, 10);
        const groupsList = data.content || [];
        setGroups(groupsList);

        // Calculate total unread
        let total = 0;
        for (const group of groupsList) {
          try {
            const count = await chatApi.getUnreadCount(group.id);
            total += count;
          } catch (error) {
            // Silently ignore errors for individual groups
            console.debug('Failed to load unread count for group:', error);
          }
        }
        setUnreadCount(total);
      } catch (error) {
        // Silently handle auth or network errors
        console.debug('Failed to load chat groups:', error);
        setUnreadCount(0);
        setGroups([]);
      }
    };

    loadUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, token, isAuthHydrated]);

  if (!user || !token) {
    return null;
  }

  const router = useRouter();

  return (
    <div
      className="fixed bottom-6 right-6 z-40"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <button
        type="button"
        aria-label="Mở tin nhắn"
        onClick={() => router.push('/chat')}
        className="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer transition transform hover:scale-110"
      >
        <span className="text-2xl">💬</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {showPreview && groups.length > 0 && (
        <div className="absolute bottom-20 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
          <h3 className="font-bold text-gray-900 mb-2 text-sm">Cuộc trò chuyện gần đây</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {groups.slice(0, 5).map((group) => (
              <Link
                key={group.id}
                href={`/chat?group=${group.id}`}
                className="block p-2 hover:bg-gray-50 rounded-lg transition"
              >
                <p className="text-sm font-medium text-gray-900 truncate">
                  {group.groupName}
                </p>
                <p className="text-xs text-gray-600">
                  {group.memberCount} thành viên
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
