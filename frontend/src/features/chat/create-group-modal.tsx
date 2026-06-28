"use client";

import { useState } from "react";
import chatApi from "./api";

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({
  onClose,
  onSuccess,
}: CreateGroupModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    groupName: "",
    groupType: "CLASS_GROUP",
    scope: "class",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await chatApi.createGroup({
        groupName: formData.groupName,
        groupType: formData.groupType,
        scope: formData.scope,
        description: formData.description,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo nhóm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Tạo nhóm mới</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên nhóm *
            </label>
            <input
              type="text"
              value={formData.groupName}
              onChange={(e) =>
                setFormData({ ...formData, groupName: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên nhóm"
            />
          </div>

          {/* Group Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại nhóm *
            </label>
            <select
              value={formData.groupType}
              onChange={(e) =>
                setFormData({ ...formData, groupType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CLASS_GROUP">Nhóm lớp</option>
              <option value="SUBJECT_CLASS_GROUP">Nhóm môn học</option>
              <option value="DEPARTMENT_GROUP">Nhóm tổ chuyên môn</option>
              <option value="ROLE_GROUP">Nhóm theo vai trò</option>
              <option value="CUSTOM_GROUP">Nhóm tùy chỉnh</option>
            </select>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phạm vi
            </label>
            <input
              type="text"
              value={formData.scope}
              onChange={(e) =>
                setFormData({ ...formData, scope: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: class, department, role"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả tùy chọn"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !formData.groupName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
