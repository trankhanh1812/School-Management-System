import { dashboardRoutes, publicRoutes } from "@/constants/routes";

export function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isDashboardRoute(pathname: string) {
  return dashboardRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
