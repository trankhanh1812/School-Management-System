'use client';

import { ChatGroupResponse } from './api';
import { useState } from 'react';

interface ChatGroupListProps {
  groups: ChatGroupResponse[];
  selectedGroup: ChatGroupResponse | null;
  onSelectGroup: (group: ChatGroupResponse) => void;
  loading: boolean;
}

export default function ChatGroupList({
  groups,
  selectedGroup,
  onSelectGroup,
  loading,
}: ChatGroupListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = groups.filter((g) =>
    g.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col overflow-hidden flex-1">
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Tìm nhóm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Groups List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">Đang tải...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex items-center justify-center h-32 p-4">
            <p className="text-gray-500 text-center">Không tìm thấy nhóm nào</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 transition ${
                selectedGroup?.id === group.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 truncate">
                    {group.groupName}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {group.memberCount} thành viên • {group.messageCount} tin nhắn
                  </p>
                </div>
                {group.messageCount > 0 && (
                  <span className="ml-2 flex-shrink-0 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    {group.messageCount}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
