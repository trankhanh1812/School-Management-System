import { AuthStatus } from "@/features/auth/components/auth-status";

export function StudentDataState({
  source,
  error,
}: {
  source: "api";
  error?: string;
}) {
  if (error) {
    return <AuthStatus tone="info" message={error} />;
  }

  return (
    <AuthStatus
      tone="success"
      message="Dữ liệu học sinh đã được đồng bộ và sẵn sàng sử dụng."
    />
  );
}
