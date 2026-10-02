import { UserRole } from '@/types';

export interface RolePermissions {
  canViewDashboard: boolean;
  canEditDashboard: boolean;
  canAcknowledgeAlerts: boolean;
  canRunSimulations: boolean;
  canCreateRequisition: boolean;
  canApproveRequisition: boolean;
  canExportReports: boolean;
  canModifyConfig: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  'NCPOR Operations': {
    canViewDashboard: true,
    canEditDashboard: true,
    canAcknowledgeAlerts: true,
    canRunSimulations: true,
    canCreateRequisition: true,
    canApproveRequisition: true,
    canExportReports: true,
    canModifyConfig: true,
  },
  'Station Engineer': {
    canViewDashboard: true,
    canEditDashboard: true,
    canAcknowledgeAlerts: true,
    canRunSimulations: true,
    canCreateRequisition: true,
    canApproveRequisition: false,
    canExportReports: true,
    canModifyConfig: false,
  },
  'Logistics Officer': {
    canViewDashboard: true,
    canEditDashboard: false,
    canAcknowledgeAlerts: false, // Limited
    canRunSimulations: true,
    canCreateRequisition: true,
    canApproveRequisition: true,
    canExportReports: true,
    canModifyConfig: false,
  },
  'Leadership': {
    canViewDashboard: true,
    canEditDashboard: false,
    canAcknowledgeAlerts: false,
    canRunSimulations: true, // Read-only / interactive preview
    canCreateRequisition: false,
    canApproveRequisition: true, // Executive approval override
    canExportReports: true,
    canModifyConfig: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return !!ROLE_PERMISSIONS[role]?.[permission];
}
