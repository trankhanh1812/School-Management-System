"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthSession } from "@/hooks/use-auth-session";
import chatApi, { ChatGroupResponse, ChatMessageResponse } from "./api";
import ChatGroupList from "./chat-group-list";
import ChatWindow from "./chat-window";
import CreateGroupModal from "./create-group-modal";
import { useChatWebSocket } from "./hooks";

export default function ChatPage() {
  const { session } = useAuthSession();
  const user = session?.user;
  const token = session?.tokens.accessToken;
  const [groups, setGroups] = useState<ChatGroupResponse[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroupResponse | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { connected, send, subscribe, subscribeToGroup } =
    useChatWebSocket(token);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load user groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Subscribe to selected group's STOMP topic
  useEffect(() => {
    if (!selectedGroup) return;

    const unsubscribe = subscribeToGroup(selectedGroup.id, (msg) => {
      if (
        msg.action === "send_message" &&
        selectedGroup?.id === msg.chatGroupId
      ) {
        // Ensure we have a valid message ID
        if (!msg.messageId || typeof msg.messageId !== "string") {
          console.warn("Received message without valid ID:", msg);
          return;
        }

        setMessages((prev) => {
          // More robust dedup: check by ID and timestamp to prevent duplicates
          const isDuplicate = prev.some(
            (m) =>
              m.id === msg.messageId ||
              (m.senderId === msg.senderId &&
                m.createdAt === msg.timestamp &&
                m.messageText === msg.messageText),
          );

          if (isDuplicate) {
            return prev;
          }

          const newMessage: ChatMessageResponse = {
            id: msg.messageId as string,
            chatGroupId: msg.chatGroupId,
            senderId: msg.senderId,
            senderName: msg.senderName,
            messageText: msg.messageText || "",
            mediaUrl: msg.mediaUrl,
            mediaType: msg.mediaType,
            fileName: msg.fileName,
            messageType: msg.messageType || "TEXT",
            readCount: 0,
            isReadByCurrentUser: false,
            createdAt: msg.timestamp,
            updatedAt: msg.timestamp,
          };

          return [...prev, newMessage];
        });
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [selectedGroup, subscribeToGroup]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await chatApi.listMyGroups(0, 50);
      setGroups(data.content || []);
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (group: ChatGroupResponse) => {
    setSelectedGroup(group);
    setMessages([]);
    try {
      const data = await chatApi.listGroupMessages(group.id, 0, 50);
      setMessages((data.content || []).reverse()); // Reverse to show newest at bottom
      // Mark all as read
      await chatApi.markGroupMessagesAsRead(group.id);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = async (messageData: {
    text?: string;
    media?: string;
    mediaType?: string;
    fileName?: string;
  }) => {
    if (!selectedGroup || !user) return;

    try {
      const message = await chatApi.sendMessage(selectedGroup.id, {
        messageText: messageData.text,
        mediaUrl: messageData.media,
        mediaType: messageData.mediaType,
        fileName: messageData.fileName,
        messageType: messageData.media ? "MEDIA" : "TEXT",
      });

      setMessages((prev) => [...prev, message]);

      // Broadcast via WebSocket
      if (connected) {
        send({
          action: "send_message",
          chatGroupId: selectedGroup.id,
          messageId: message.id,
          senderId: user.id,
          senderName: user.fullName,
          messageText: message.messageText,
          mediaUrl: message.mediaUrl,
          mediaType: message.mediaType,
          fileName: message.fileName,
          messageType: message.messageType,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCreateGroup = async () => {
    await loadGroups();
    setShowCreateModal(false);
  };

  if (!user) {
    return <div>Đang tải...</div>;
  }

  const canCreateGroup = user.role === "ADMIN" || user.role === "TEACHER";

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 bg-gray-50 p-4">
      {/* Groups Panel */}
      <div className="w-80 flex flex-col border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold text-gray-800">Tin nhắn</h1>
          {canCreateGroup && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Tạo nhóm mới
            </button>
          )}
        </div>
        <ChatGroupList
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={handleSelectGroup}
          loading={loading}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <ChatWindow
            group={selectedGroup}
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUserId={user.id}
            connected={connected}
          />
        ) : (
          <div className="flex items-center justify-center h-full rounded-lg bg-white border border-gray-200">
            <p className="text-gray-500">Chọn một nhóm để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateGroup}
        />
      )}
    </div>
  );
}
