"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/shared/ui/modal";
import { Button } from "@/shared/ui/button";
import { teacherApi } from "@/features/teacher/api";
import { classroomApi } from "@/features/classroom/api";
import chatApi from "@/features/chat/api";

type Props = {
  open: boolean;
  onClose: () => void;
  groupId: string;
};

export default function AddGroupMembersModal({ open, onClose, groupId }: Props) {
  const [tab, setTab] = useState<"teachers" | "students">("teachers");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchTeachers();
    fetchClasses();
    setSelected({});
  }, [open]);

  async function fetchTeachers() {
    try {
      const resp = await teacherApi.list({ limit: 200 });
      setTeachers(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error(e);
      setTeachers([]);
    }
  }

  async function fetchClasses() {
    try {
      const resp = await classroomApi.list({ limit: 200 });
      setClasses(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error(e);
      setClasses([]);
    }
  }

  async function onSelectClass(classCode: string) {
    setStudents([]);
    setSelectedClass(classCode || null);
    try {
      const resp = await classroomApi.students(classCode);
      setStudents(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error(e);
    }
  }

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function handleAdd() {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (!ids.length) {
      // If adding students and a class is selected, add entire class
      if (tab === 'students' && selectedClass) {
        setLoading(true);
        try {
          await chatApi.addStudentMembers(groupId, null, selectedClass);
          onClose();
          return;
        } catch (apiErr: any) {
          console.error('API Error Details:', {
            status: apiErr?.response?.status,
            statusText: apiErr?.response?.statusText,
            data: apiErr?.response?.data,
            config: apiErr?.config,
            message: apiErr?.message
          });
          alert(`Không thể thêm thành viên trong lớp: ${(apiErr as any)?.response?.data?.message || (apiErr as any)?.message}`);
          return;
        } finally {
          setLoading(false);
        }
      }
      return onClose();
    }
    setLoading(true);
    try {
      if (tab === "teachers") {
        // Teachers list may contain profile id and email. Prefer adding by email if available.
        for (const id of ids) {
          const teacher = teachers.find((t) => t.id === id);
          if (teacher?.email) {
            await chatApi.addMemberByEmail(groupId, teacher.email);
          } else {
            await chatApi.addMember(groupId, id);
          }
        }
        onClose();
        return;
      }

      if (tab === "students") {
        // Use the new backend endpoint to add students by code or class
        console.log('Adding students:', { groupId, studentCodes: ids, classCode: null });
        try {
          await chatApi.addStudentMembers(groupId, ids, null);
          onClose();
        } catch (apiErr: any) {
          console.error('API Error Details:', {
            status: apiErr?.response?.status,
            statusText: apiErr?.response?.statusText,
            data: apiErr?.response?.data,
            config: apiErr?.config,
            message: apiErr?.message
          });
          throw apiErr;
        }
        return;
      }
    } catch (err) {
      console.error('Full error:', err);
      alert(`Không thể thêm thành viên. Trạng thái: ${(err as any)?.response?.status}, thông báo: ${(err as any)?.response?.data?.message || (err as any)?.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="Thêm thành viên vào nhóm" onClose={onClose} size="md" footer={
      <>
        <Button tone="secondary" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button onClick={handleAdd} disabled={loading}>
          Thêm mục đã chọn
        </Button>
      </>
    }>
      <div className="mb-4 flex gap-2">
        <button className={`px-3 py-2 rounded ${tab === 'teachers' ? 'bg-slate-100' : ''}`} onClick={() => setTab('teachers')}>Giáo viên</button>
        <button className={`px-3 py-2 rounded ${tab === 'students' ? 'bg-slate-100' : ''}`} onClick={() => setTab('students')}>Học sinh</button>
      </div>

      {tab === "teachers" ? (
        <div className="space-y-3">
          {teachers.map((t) => (
            <label key={t.id} className="flex items-center gap-3 p-2 border rounded">
              <input type="checkbox" checked={!!selected[t.id]} onChange={() => toggle(t.id)} />
              <div>
                <div className="font-medium">{t.fullName}</div>
                <div className="text-sm text-slate-500">{t.teacherCode} • {t.department}</div>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Lớp</label>
            <select onChange={(e) => onSelectClass(e.target.value)} className="mt-1 w-full">
              <option value="">-- chọn lớp --</option>
              {classes.map((c) => (
                <option key={c.classCode} value={c.classCode}>{c.classCode} - {c.className}</option>
              ))}
            </select>
          </div>

          <p className="text-sm text-slate-500">Chọn học sinh để thêm vào nhóm này.</p>

          {students.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Không tìm thấy học sinh trong lớp đã chọn</p>
          ) : (
            students.map((s) => (
              <label key={s.studentCode} className="flex items-center gap-3 p-2 border rounded">
                <input type="checkbox" checked={!!selected[s.studentCode]} onChange={() => toggle(s.studentCode)} />
                <div>
                  <div className="font-medium">{s.fullName}</div>
                  <div className="text-sm text-slate-500">{s.studentCode}</div>
                </div>
              </label>
            ))
          )}
        </div>
      )}
    </Modal>
  );
}
