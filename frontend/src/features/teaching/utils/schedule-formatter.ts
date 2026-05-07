import type { TeachingScheduleDetail } from "@/features/teaching/api";

const DAY_NAMES: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

/**
 * Format schedule data into readable text
 * Example: "Thứ 2: Tiết 1, 2\nThứ 3: Tiết 3, 4"
 */
export function formatSchedule(scheduleData?: TeachingScheduleDetail[]): string {
  if (!scheduleData || scheduleData.length === 0) {
    return "--";
  }

  // Group by day
  const byDay = new Map<number, number[]>();
  scheduleData.forEach((item) => {
    if (!byDay.has(item.day)) {
      byDay.set(item.day, []);
    }
    const periods = byDay.get(item.day)!;
    if (!periods.includes(item.period)) {
      periods.push(item.period);
    }
  });

  // Sort periods for each day
  byDay.forEach((periods) => {
    periods.sort((a, b) => a - b);
  });

  // Format output
  const lines: string[] = [];
  const sortedDays = Array.from(byDay.keys()).sort();
  
  sortedDays.forEach((day) => {
    const periods = byDay.get(day) || [];
    const dayName = DAY_NAMES[day] || `Ngày ${day}`;
    lines.push(`${dayName}: Tiết ${periods.join(", ")}`);
  });

  return lines.join("\n");
}

/**
 * Detect conflicts in schedule data
 * Returns array of conflicts with day, period, and conflicting teachers/classes
 */
export function detectConflicts(
  scheduleData: TeachingScheduleDetail[],
  teacherCode: string
): { day: number; period: number; classCode: string }[] {
  const conflicts: { day: number; period: number; classCode: string }[] = [];
  
  // Group by day and period to find same-teacher-same-time duplicates
  const timeSlots = new Map<string, { classCode: string }[]>();
  
  scheduleData.forEach((item) => {
    const key = `${item.day}_${item.period}`;
    if (!timeSlots.has(key)) {
      timeSlots.set(key, []);
    }
    timeSlots.get(key)!.push({ classCode: item.classCode });
  });

  // If same teacher has 2+ assignments at same time = conflict
  timeSlots.forEach((assignments, key) => {
    if (assignments.length > 1) {
      const [day, period] = key.split("_").map(Number);
      assignments.forEach((assignment) => {
        conflicts.push({
          day,
          period,
          classCode: assignment.classCode,
        });
      });
    }
  });

  return conflicts;
}
