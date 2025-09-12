// Shared chart colors and helper to map event types to colors
export const CHART_COLORS = {
  primary: '#3b82f6',    // blue-500
  success: '#10b981',    // green-500
  danger: '#ef4444',     // red-500
  warning: '#f59e0b',    // amber-500
  purple: '#8b5cf6',     // purple-500
  gray: '#6b7280'        // gray-500
};

export function getEventColor(type: string | undefined) {
  if (!type) return CHART_COLORS.purple;
  if (type === 'LOGIN_SUCCESS') return CHART_COLORS.success;
  if (type === 'FAMILY_REVOKED') return CHART_COLORS.danger;
  if (type === 'TOKEN_REUSE_DETECTED') return CHART_COLORS.danger;
  if (type === 'REFRESH') return CHART_COLORS.primary;
  if (type === 'USER_SIGNUP') return CHART_COLORS.purple;
  if (type === 'LOGIN_FAILED') return '#fbbf24'; // yellow-400
  return CHART_COLORS.purple;
}
