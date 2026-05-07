import type { UserRole } from "@/constants/roles";

export type RoleBadgeVariant = "default" | "outline" | "subtle";

const roleConfig: Record<
  UserRole,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    lightBg: string;
    lightBorder: string;
  }
> = {
  ADMIN: {
    label: "Quản trị viên",
    color: "text-red-800",
    bgColor: "bg-red-600",
    borderColor: "border-red-300",
    lightBg: "bg-red-50",
    lightBorder: "border-red-200",
  },
  TEACHER: {
    label: "Giáo viên",
    color: "text-amber-800",
    bgColor: "bg-amber-600",
    borderColor: "border-amber-300",
    lightBg: "bg-amber-50",
    lightBorder: "border-amber-200",
  },
  STUDENT: {
    label: "Học sinh",
    color: "text-blue-800",
    bgColor: "bg-blue-600",
    borderColor: "border-blue-300",
    lightBg: "bg-blue-50",
    lightBorder: "border-blue-200",
  },
  PARENT: {
    label: "Phụ huynh",
    color: "text-purple-800",
    bgColor: "bg-purple-600",
    borderColor: "border-purple-300",
    lightBg: "bg-purple-50",
    lightBorder: "border-purple-200",
  },
};

export function RoleBadge({
  role,
  variant = "default",
  className,
}: {
  role: UserRole;
  variant?: RoleBadgeVariant;
  className?: string;
}) {
  const config = roleConfig[role];

  if (variant === "outline") {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border ${config.borderColor} px-3 py-1 text-sm font-medium ${config.color} ${className}`}
      >
        <span className={`h-2 w-2 rounded-full ${config.bgColor}`}></span>
        {config.label}
      </span>
    );
  }

  if (variant === "subtle") {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full ${config.lightBg} ${config.lightBorder} border px-3 py-1 text-sm font-medium ${config.color} ${className}`}
      >
        <span className={`h-2 w-2 rounded-full ${config.bgColor}`}></span>
        {config.label}
      </span>
    );
  }

  // default variant
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full ${config.bgColor} px-3 py-1 text-sm font-medium text-white ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-white/40"></span>
      {config.label}
    </span>
  );
}
