import { apiClient } from '@/lib/api/api-client';
import { ApiResponse } from '@/types/api';

export interface ChatGroupResponse {
  id: string;
  groupName: string;
  groupType: string;
  description?: string;
  scope: string;
  createdBy: string;
  classCode?: string;
  subjectCode?: string;
  departmentCode?: string;
  isArchived: boolean;
  memberCount: number;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageResponse {
  id: string;
  chatGroupId: string;
  senderId: string;
  senderName: string;
  messageText?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  messageType: string;
  readCount: number;
  isReadByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatGroupRequest {
  groupName: string;
  groupType: string;
  description?: string;
  scope: string;
  classId?: string;
  subjectId?: string;
  departmentId?: string;
}

export interface SendMessageRequest {
  messageText?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  messageType?: string;
}

export interface ChatGroupMemberResponse {
  id: string;
  chatGroupId: string;
  userId: string;
  userName: string;
  fullName: string;
  joinedAt: string;
}

const chatApi = {
  // Chat Group APIs
  async listMyGroups(page = 0, size = 20) {
    const query = new URLSearchParams({ page: page.toString(), size: size.toString() });
    const response = await apiClient.get<
      ApiResponse<{
        content: ChatGroupResponse[];
        totalElements: number;
        totalPages: number;
      }>
    >(`/chat/groups?${query.toString()}`, {
      authenticated: true,
    });
    return response.data;
  },

  async getGroup(groupId: string) {
    const response = await apiClient.get<ApiResponse<ChatGroupResponse>>(
      `/chat/groups/${groupId}`,
      { authenticated: true }
    );
    return response.data;
  },

  async createGroup(data: CreateChatGroupRequest) {
    const response = await apiClient.post<ApiResponse<ChatGroupResponse>>(
      '/chat/groups',
      data,
      { authenticated: true }
    );
    return response.data;
  },

  async updateGroup(groupId: string, data: Partial<CreateChatGroupRequest>) {
    const response = await apiClient.put<ApiResponse<ChatGroupResponse>>(
      `/chat/groups/${groupId}`,
      data,
      { authenticated: true }
    );
    return response.data;
  },

  async addMember(groupId: string, userId: string) {
    const response = await apiClient.post<ApiResponse<void>>(
      `/chat/groups/${groupId}/members/${userId}`,
      {},
      { authenticated: true }
    );
    return response.data;
  },

  async addMemberByEmail(groupId: string, email: string) {
    const response = await apiClient.post<ApiResponse<void>>(
      `/chat/groups/${groupId}/members/by-email`,
      { email },
      { authenticated: true }
    );
    return response.data;
  },

  async addStudentMembers(groupId: string, studentCodes: string[] | null, classCode: string | null) {
    const response = await apiClient.post<ApiResponse<void>>(
      `/chat/groups/${groupId}/members/students/add`,
      { studentCodes, classCode },
      { authenticated: true }
    );
    return response.data;
  },

  async removeMember(groupId: string, userId: string) {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/chat/groups/${groupId}/members/${userId}`,
      { authenticated: true }
    );
    return response.data;
  },

  async archiveGroup(groupId: string) {
    const response = await apiClient.post<ApiResponse<void>>(
      `/chat/groups/${groupId}/archive`,
      {},
      { authenticated: true }
    );
    return response.data;
  },

  async deleteGroup(groupId: string) {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/chat/groups/${groupId}`,
      { authenticated: true }
    );
    return response.data;
  },

  // Chat Message APIs
  async sendMessage(groupId: string, data: SendMessageRequest) {
    const response = await apiClient.post<ApiResponse<ChatMessageResponse>>(
      `/chat/groups/${groupId}/messages`,
      data,
      { authenticated: true }
    );
    return response.data;
  },

  async listGroupMessages(groupId: string, page = 0, size = 50) {
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: 'createdAt,desc',
    });
    const response = await apiClient.get<
      ApiResponse<{
        content: ChatMessageResponse[];
        totalElements: number;
        totalPages: number;
      }>
    >(`/chat/groups/${groupId}/messages?${query.toString()}`, {
      authenticated: true,
    });
    return response.data;
  },

  async searchMessages(groupId: string, keyword: string, page = 0, size = 20) {
    const query = new URLSearchParams({
      keyword,
      page: page.toString(),
      size: size.toString(),
    });
    const response = await apiClient.get<
      ApiResponse<{
        content: ChatMessageResponse[];
        totalElements: number;
        totalPages: number;
      }>
    >(`/chat/groups/${groupId}/messages/search?${query.toString()}`, {
      authenticated: true,
    });
    return response.data;
  },

  async updateMessage(messageId: string, data: SendMessageRequest) {
    const response = await apiClient.put<ApiResponse<ChatMessageResponse>>(
      `/chat/messages/${messageId}`,
      data,
      { authenticated: true }
    );
    return response.data;
  },

  async deleteMessage(messageId: string) {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/chat/messages/${messageId}`,
      { authenticated: true }
    );
    return response.data;
  },

  async markAsRead(messageId: string) {
    const response = await apiClient.post<ApiResponse<void>>(
      `/chat/messages/${messageId}/read`,
      {},
      { authenticated: true }
    );
    return response.data;
  },

  async markGroupMessagesAsRead(groupId: string) {
    const response = await apiClient.post<ApiResponse<void>>(
      `/chat/groups/${groupId}/read-all`,
      {},
      { authenticated: true }
    );
    return response.data;
  },

  async getUnreadCount(groupId: string) {
    const response = await apiClient.get<ApiResponse<number>>(
      `/chat/groups/${groupId}/unread-count`,
      { authenticated: true }
    );
    return response.data;
  },
};

export default chatApi;
