import type { ReactNode } from "react";
import type { Permission } from "@/hooks/use-role-permissions";
import { useRolePermissions } from "@/hooks/use-role-permissions";

export type PermissionGuardProps = {
  permission?: Permission;
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Component to conditionally render content based on user permissions
 * Usage: <PermissionGuard permission="edit_student">Edit button</PermissionGuard>
 */
export function PermissionGuard({
  permission,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission } = useRolePermissions();

  if (!permission || hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export type FeatureVisibilityProps = {
  feature: keyof ReturnType<typeof useRolePermissions>["features"];
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Component to conditionally render content based on feature visibility
 * Usage: <FeatureVisibility feature="canEditStudent">Edit form</FeatureVisibility>
 */
export function FeatureVisibility({
  feature,
  fallback = null,
  children,
}: FeatureVisibilityProps) {
  const { features } = useRolePermissions();
  const isVisible = features[feature];

  if (isVisible) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
