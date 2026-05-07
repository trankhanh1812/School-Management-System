export const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"] as const;

export const dashboardRoutes = [
  "/dashboard",
  "/chat",
  "/students",
  "/students/conduct",
  "/teachers",
  "/classes",
  "/subjects",
  "/teaching-assignments",
  "/scores",
  "/scores/exams",
  "/scores/gradebook",
  "/attendance",
  "/schedule",
  "/reports",
  "/notifications",
  "/system-settings",
] as const;
