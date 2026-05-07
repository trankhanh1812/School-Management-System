import { AuthStatus } from "@/features/auth/components/auth-status";

export function StudentDataState({
  source,
  error,
}: {
  source: "api" | "mock";
  error?: string;
}) {
  if (error) {
    return <AuthStatus tone="info" message={error} />;
  }

  if (source === "api") {
    return <AuthStatus tone="success" message="Dữ liệu học sinh đã được đồng bộ và sẵn sàng sử dụng." />;
  }

  return (
    <AuthStatus
      tone="info"
      message="Dữ liệu đang được đồng bộ. Một số mục có thể tạm thời chưa hiển thị đầy đủ."
    />
  );
}
